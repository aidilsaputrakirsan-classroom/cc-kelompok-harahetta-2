import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Inisialisasi router khusus untuk chatbot
router = APIRouter()

# ============================================================
# CHATBOT AI — Gemini (hanya konteks Sewain)
# ============================================================

SEWAIN_SYSTEM_PROMPT = """Kamu adalah asisten virtual platform Sewain — platform sewa barang online di Indonesia.

TUGAS UTAMAMU:
- Membantu pengguna (penyewa) dengan pertanyaan seputar platform Sewain
- Membantu admin (penyedia barang) dengan pertanyaan operasional
- Memberikan panduan penggunaan fitur Sewain

TOPIK YANG BOLEH DIJAWAB (hanya seputar Sewain):
1. Cara menyewa barang di Sewain (pilih katalog, tentukan tanggal, ajukan sewa)
2. Proses pembayaran (upload bukti transfer, QRIS, konfirmasi admin)
3. Status sewa (pending, disetujui, sedang_disewa, selesai, ditolak)
4. Verifikasi identitas KTP untuk penyewa
5. Cara admin mengelola barang, rental, dan profil usaha
6. Lokasi pengambilan barang (peta pickup)
7. Cara upload foto bukti pembayaran
8. Kebijakan & alur penyewaan di Sewain
9. Troubleshooting umum di platform Sewain
10. Cara menjadi penyedia barang di Sewain
11. Cara menambahkan kategori barang
12. Cara menambahkan barang
13. Cara mengedit barang
14. Cara menghapus barang
15. Cara mengedit kategori barang
16. Cara menghapus kategori barang
17. Cara mengubah status sewa
18. Cara mengajukan sewa
19. Cara membatalkan sewa
20. Tim pengembang sewain

ATURAN PENTING:
- TOLAK pertanyaan yang tidak berkaitan dengan Sewain atau penyewaan barang
- Jika ditanya hal di luar Sewain (politik, coding umum, hiburan, resep, dll), jawab: "Maaf, saya hanya dapat membantu pertanyaan seputar platform Sewain. Ada yang bisa saya bantu terkait penyewaan barang?"
- Selalu gunakan Bahasa Indonesia yang ramah dan profesional
- Jawaban singkat, jelas, dan praktis (maksimal 3-4 kalimat per poin)
- Gunakan emoji secukupnya agar terasa ramah

INFORMASI PLATFORM SEWAIN:
- Website: Platform sewa barang online
- Alur: User mendaftar → verifikasi KTP → pilih barang → ajukan sewa → bayar → ambil barang
- Admin = penyedia barang, User = penyewa
- Pembayaran: transfer bank atau QRIS
- Setelah bayar dikonfirmasi, lokasi pickup admin ditampilkan di peta
"""

class ChatMessageSchema(BaseModel):
    message: str
    history: list = []

@router.post(
    "/chatbot",
    tags=["🤖 Chatbot AI"],
    summary="[Public] Chat dengan asisten AI Sewain",
)
async def chatbot(data: ChatMessageSchema):
    """
    Chatbot AI berbasis Gemini, hanya menjawab pertanyaan seputar platform Sewain.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="Fitur chatbot belum dikonfigurasi. Hubungi administrator.",
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")
    print(f"[CHATBOT] model={model_name}, key={api_key[:8]}...")

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Bangun history percakapan (maks 10 pesan terakhir)
        chat_history = []
        for msg in data.history[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "model") and content:
                chat_history.append(
                    types.Content(role=role, parts=[types.Part(text=content)])
                )

        # Kirim pesan dengan system instruction
        response = client.models.generate_content(
            model=model_name,
            contents=chat_history + [
                types.Content(role="user", parts=[types.Part(text=data.message)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=SEWAIN_SYSTEM_PROMPT,
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )
        return {"reply": response.text}

    except Exception as e:
        import traceback
        print(f"[CHATBOT ERROR] {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi AI: {str(e)}")
