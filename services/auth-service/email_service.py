import os
import smtplib
import ssl
import json
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
import jwt

EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "true").lower() == "true"
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "resend").lower()
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.sumopod.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", "onboarding@resend.dev")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Sewain")
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-development-minimum-32")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

VERIFY_TOKEN_EXPIRE_HOURS = 24
RESET_TOKEN_EXPIRE_HOURS = 1


def create_email_token(user_id: int, purpose: str, expires_hours: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    payload = {
        "sub": str(user_id),
        "purpose": purpose,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_verification_token(user_id: int) -> str:
    return create_email_token(user_id, "verify_email", VERIFY_TOKEN_EXPIRE_HOURS)


def create_reset_password_token(user_id: int) -> str:
    return create_email_token(user_id, "reset_password", RESET_TOKEN_EXPIRE_HOURS)


def decode_email_token(token: str, expected_purpose: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != expected_purpose:
            return None
        return payload
    except Exception:
        return None


def _send_via_resend(to_email: str, subject: str, html_body: str) -> bool:
    if not RESEND_API_KEY:
        print(f"[EMAIL] RESEND_API_KEY belum diset — skip kirim ke {to_email}")
        return False

    payload = {
        "from": f"{MAIL_FROM_NAME} <{MAIL_FROM}>",
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=data,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            body = response.read().decode("utf-8")
            print(f"[EMAIL] Resend OK → {to_email}: {subject} | {body}")
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"[EMAIL] Resend HTTP {e.code} → {to_email}: {err_body}")
        return False
    except Exception as e:
        print(f"[EMAIL] Resend gagal → {to_email}: {e}")
        return False


def _send_via_smtp(to_email: str, subject: str, html_body: str) -> bool:
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"[EMAIL] SMTP credentials belum diset — skip kirim ke {to_email}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
    msg["To"] = to_email

    plain_text = html_body.replace("<br>", "\n").replace("</p>", "\n")
    import re
    plain_text = re.sub(r"<[^>]+>", "", plain_text)

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"[EMAIL] SMTP OK → {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] SMTP gagal → {to_email}: {e}")
        return False


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not EMAIL_ENABLED:
        print(f"[EMAIL] Disabled — skip kirim ke {to_email}: {subject}")
        return True

    if EMAIL_PROVIDER == "resend":
        return _send_via_resend(to_email, subject, html_body)
    return _send_via_smtp(to_email, subject, html_body)


def send_verification_email(to_email: str, user_name: str, token: str) -> bool:
    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifikasi Email Sewain</title>
    </head>
    <body style="margin:0; padding:0; background:#fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif; color:#18181b;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fafafa; padding:48px 16px;">
            <tr>
                <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="540" style="max-width:540px; width:100%;">
                        <tr>
                            <td style="padding:0 0 32px;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="vertical-align:middle;">
                                            <div style="width:36px; height:36px; background:#18181b; border-radius:8px; line-height:36px; text-align:center; display:inline-block;">
                                                <span style="color:#fff; font-weight:700; font-size:18px;">S</span>
                                            </div>
                                        </td>
                                        <td style="vertical-align:middle; padding-left:12px;">
                                            <span style="color:#18181b; font-size:18px; font-weight:600; letter-spacing:-0.3px;">Sewain</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#ffffff; border-radius:12px; border:1px solid #e4e4e7; padding:40px;">
                                <h1 style="color:#09090b; font-size:24px; font-weight:600; margin:0 0 12px; line-height:1.3; letter-spacing:-0.4px;">
                                    Konfirmasi alamat email
                                </h1>
                                <p style="color:#52525b; font-size:15px; line-height:1.6; margin:0 0 32px;">
                                    Hai {user_name}, sebelum bisa mulai menyewa di Sewain, kami perlu memverifikasi bahwa email ini benar milik Anda.
                                </p>
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                                    <tr>
                                        <td style="background:#18181b; border-radius:8px;">
                                            <a href="{verify_url}"
                                               style="display:inline-block; color:#ffffff; text-decoration:none; padding:12px 24px; font-weight:500; font-size:14px; letter-spacing:0.1px;">
                                                Konfirmasi email →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="padding:16px 0; border-top:1px solid #f4f4f5;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td style="width:24px; vertical-align:top; padding-right:12px;">
                                                        <span style="color:#a1a1aa; font-size:14px;">→</span>
                                                    </td>
                                                    <td>
                                                        <p style="color:#52525b; font-size:14px; line-height:1.5; margin:0;">
                                                            Tautan ini berlaku selama 24 jam.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:16px 0; border-top:1px solid #f4f4f5;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td style="width:24px; vertical-align:top; padding-right:12px;">
                                                        <span style="color:#a1a1aa; font-size:14px;">→</span>
                                                    </td>
                                                    <td>
                                                        <p style="color:#52525b; font-size:14px; line-height:1.5; margin:0;">
                                                            Tidak merasa membuat akun? Lewati saja, akun tidak akan aktif tanpa konfirmasi.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                <div style="margin-top:24px; padding-top:24px; border-top:1px solid #f4f4f5;">
                                    <p style="color:#71717a; font-size:13px; margin:0 0 8px;">
                                        Tombol tidak berfungsi? Salin tautan berikut ke browser:
                                    </p>
                                    <a href="{verify_url}" style="color:#3f3f46; font-size:13px; word-break:break-all; font-family:'SF Mono', Menlo, Consolas, monospace; text-decoration:underline;">
                                        {verify_url}
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px 8px 0; text-align:center;">
                                <p style="color:#a1a1aa; font-size:12px; line-height:1.6; margin:0;">
                                    Email ini dikirim otomatis oleh Sewain.<br>
                                    &copy; 2026 Kelompok Harahetta-2 &middot; Komputasi Awan ITK
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    return _send_email(to_email, "Konfirmasi alamat email Sewain Anda", html)


def send_reset_password_email(to_email: str, user_name: str, token: str) -> bool:
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password Sewain</title>
    </head>
    <body style="margin:0; padding:0; background:#fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif; color:#18181b;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fafafa; padding:48px 16px;">
            <tr>
                <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="540" style="max-width:540px; width:100%;">
                        <tr>
                            <td style="padding:0 0 32px;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="vertical-align:middle;">
                                            <div style="width:36px; height:36px; background:#18181b; border-radius:8px; line-height:36px; text-align:center; display:inline-block;">
                                                <span style="color:#fff; font-weight:700; font-size:18px;">S</span>
                                            </div>
                                        </td>
                                        <td style="vertical-align:middle; padding-left:12px;">
                                            <span style="color:#18181b; font-size:18px; font-weight:600; letter-spacing:-0.3px;">Sewain</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#ffffff; border-radius:12px; border:1px solid #e4e4e7; padding:40px;">
                                <h1 style="color:#09090b; font-size:24px; font-weight:600; margin:0 0 12px; line-height:1.3; letter-spacing:-0.4px;">
                                    Setel ulang password
                                </h1>
                                <p style="color:#52525b; font-size:15px; line-height:1.6; margin:0 0 32px;">
                                    Hai {user_name}, kami menerima permintaan untuk mereset password akun Sewain Anda.
                                    Klik tombol di bawah untuk membuat password baru.
                                </p>
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                                    <tr>
                                        <td style="background:#18181b; border-radius:8px;">
                                            <a href="{reset_url}"
                                               style="display:inline-block; color:#ffffff; text-decoration:none; padding:12px 24px; font-weight:500; font-size:14px; letter-spacing:0.1px;">
                                                Setel ulang password →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="padding:16px 0; border-top:1px solid #f4f4f5;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td style="width:24px; vertical-align:top; padding-right:12px;">
                                                        <span style="color:#a1a1aa; font-size:14px;">→</span>
                                                    </td>
                                                    <td>
                                                        <p style="color:#52525b; font-size:14px; line-height:1.5; margin:0;">
                                                            Tautan ini hanya berlaku selama 1 jam.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:16px 0; border-top:1px solid #f4f4f5;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td style="width:24px; vertical-align:top; padding-right:12px;">
                                                        <span style="color:#a1a1aa; font-size:14px;">→</span>
                                                    </td>
                                                    <td>
                                                        <p style="color:#52525b; font-size:14px; line-height:1.5; margin:0;">
                                                            Setelah dipakai, tautan ini tidak bisa digunakan lagi.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                <div style="margin-top:24px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px;">
                                    <p style="color:#991b1b; font-size:13px; line-height:1.5; margin:0; font-weight:500;">
                                        Bukan Anda yang meminta?
                                    </p>
                                    <p style="color:#7f1d1d; font-size:13px; line-height:1.5; margin:6px 0 0;">
                                        Abaikan email ini. Password lama Anda tetap aman selama tautan tidak diakses.
                                    </p>
                                </div>
                                <div style="margin-top:24px; padding-top:24px; border-top:1px solid #f4f4f5;">
                                    <p style="color:#71717a; font-size:13px; margin:0 0 8px;">
                                        Tombol tidak berfungsi? Salin tautan berikut ke browser:
                                    </p>
                                    <a href="{reset_url}" style="color:#3f3f46; font-size:13px; word-break:break-all; font-family:'SF Mono', Menlo, Consolas, monospace; text-decoration:underline;">
                                        {reset_url}
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px 8px 0; text-align:center;">
                                <p style="color:#a1a1aa; font-size:12px; line-height:1.6; margin:0;">
                                    Email ini dikirim otomatis oleh Sewain.<br>
                                    &copy; 2026 Kelompok Harahetta-2 &middot; Komputasi Awan ITK
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    return _send_email(to_email, "Setel ulang password Sewain", html)
