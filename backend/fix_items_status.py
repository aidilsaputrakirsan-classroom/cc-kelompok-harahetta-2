"""
Script untuk fix status semua barang berdasarkan stok aktual.
Jalankan dengan: python fix_items_status.py
"""

from database import SessionLocal
from models import Item, Rental, ItemStatus, RentalStatus


def recalculate_item_status(db, item):
    """
    Recalculate item status berdasarkan stok dan rental aktif.
    
    Aturan:
    - stok > 0 → available
    - stok == 0 DAN ada rental aktif → rented
    - stok == 0 DAN tidak ada rental aktif → unavailable
    """
    if item.stok > 0:
        item.status = ItemStatus.available
    else:
        # Cek apakah ada rental aktif untuk item ini
        active_rental = db.query(Rental).filter(
            Rental.item_id == item.id,
            Rental.status.in_([
                RentalStatus.pending,
                RentalStatus.disetujui,
                RentalStatus.sedang_disewa,
            ])
        ).first()
        if active_rental:
            item.status = ItemStatus.rented
        else:
            item.status = ItemStatus.unavailable


def fix_all_items_status():
    """Fix status semua barang di database."""
    db = SessionLocal()
    try:
        items = db.query(Item).all()
        fixed_count = 0
        
        print(f"\n🔍 Memeriksa {len(items)} barang...")
        
        for item in items:
            old_status = item.status
            recalculate_item_status(db, item)
            
            if old_status != item.status:
                print(f"  ✅ Fixed: {item.nama} ({item.id})")
                print(f"     - Stok: {item.stok}")
                print(f"     - Status lama: {old_status.value}")
                print(f"     - Status baru: {item.status.value}")
                fixed_count += 1
        
        db.commit()
        
        print(f"\n✨ Selesai! Berhasil memperbaiki {fixed_count} dari {len(items)} barang\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {str(e)}\n")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    fix_all_items_status()
