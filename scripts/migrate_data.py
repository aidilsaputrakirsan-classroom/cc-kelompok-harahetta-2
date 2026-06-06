import os
import sys
import importlib.util
from sqlalchemy import create_engine, text

# Define connection strings
MONOLITH_DB_URL = os.getenv("MONOLITH_DATABASE_URL", "postgresql://postgres:setiawan@localhost:15432/data_sewain")
AUTH_DB_URL = os.getenv("AUTH_DB_URL", "postgresql://postgres:postgres@localhost:5433/auth_db")
ITEM_DB_URL = os.getenv("ITEM_DB_URL", "postgresql://postgres:postgres@localhost:5434/item_db")
RENTAL_DB_URL = os.getenv("RENTAL_DB_URL", "postgresql://postgres:postgres@localhost:5435/rental_db")
PAYMENT_DB_URL = os.getenv("PAYMENT_DB_URL", "postgresql://postgres:postgres@localhost:5436/payment_db")

def import_service_module(service_name, module_name):
    """Dynamically imports a module from a specific service directory to avoid name collisions."""
    abs_path = os.path.abspath(f"./services/{service_name}/{module_name}.py")
    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"Service module not found at: {abs_path}")
        
    spec = importlib.util.spec_from_file_location(f"{service_name}_{module_name}", abs_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[f"{service_name}_{module_name}"] = module
    
    # Save current sys.path and temporarily add service dir to it
    orig_path = list(sys.path)
    sys.path.insert(0, os.path.dirname(abs_path))
    
    try:
        spec.loader.exec_module(module)
    finally:
        sys.path = orig_path
        
    return module

def init_target_schemas():
    """Initializes database tables on all target databases using service models."""
    print("[*] Initializing target databases...")
    
    # Auth Service DB
    print("[*] Creating tables for auth_db...")
    auth_engine = create_engine(AUTH_DB_URL)
    auth_models = import_service_module("auth-service", "models")
    auth_models.Base.metadata.drop_all(bind=auth_engine)
    auth_models.Base.metadata.create_all(bind=auth_engine)
    
    # Item Service DB
    print("[*] Creating tables for item_db...")
    item_engine = create_engine(ITEM_DB_URL)
    item_models = import_service_module("item-service", "models")
    item_models.Base.metadata.drop_all(bind=item_engine)
    item_models.Base.metadata.create_all(bind=item_engine)
    
    # Rental Service DB
    print("[*] Creating tables for rental_db...")
    rental_engine = create_engine(RENTAL_DB_URL)
    rental_models = import_service_module("rental-service", "models")
    rental_models.Base.metadata.drop_all(bind=rental_engine)
    rental_models.Base.metadata.create_all(bind=rental_engine)
    
    # Payment Service DB
    print("[*] Creating tables for payment_db...")
    payment_engine = create_engine(PAYMENT_DB_URL)
    payment_models = import_service_module("payment-service", "models")
    payment_models.Base.metadata.drop_all(bind=payment_engine)
    payment_models.Base.metadata.create_all(bind=payment_engine)
    
    print("[+] Successfully initialized all target schemas.")

def migrate_table(src_conn, target_engine, table_name, pk_col="id"):
    """Copies all records from a table in the monolith DB to the target service DB."""
    # Read rows from source
    try:
        result = src_conn.execute(text(f"SELECT * FROM {table_name}"))
        keys = list(result.keys())
        src_rows = result.fetchall()
    except Exception as e:
        print(f"[-] Skipping table '{table_name}' (not found in source DB or error: {e})")
        return
        
    if not src_rows:
        print(f"[i] Table '{table_name}' is empty in source DB. Skipping.")
        return
        
    print(f"[*] Migrating {len(src_rows)} rows for table '{table_name}'...")
    
    # Convert rows to list of dicts
    rows_dict = []
    for row in src_rows:
        row_dict = {}
        for idx, key in enumerate(keys):
            row_dict[key] = row[idx]
        rows_dict.append(row_dict)
        
    # Write to target database
    with target_engine.begin() as target_conn:
        # Truncate existing data to avoid PK conflicts on multiple runs
        target_conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE"))
        
        # Build dynamic insert query
        columns = list(rows_dict[0].keys())
        placeholders = ", ".join([f":{col}" for col in columns])
        insert_query = text(f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})")
        
        target_conn.execute(insert_query, rows_dict)
        print(f"[+] Successfully migrated table '{table_name}'.")
        
        # Reset PostgreSQL sequence for auto-increment PKs
        try:
            target_conn.execute(text(
                f"SELECT setval(pg_get_serial_sequence('{table_name}', '{pk_col}'), "
                f"coalesce(max({pk_col}), 1), max({pk_col}) IS NOT NULL) FROM {table_name}"
            ))
            print(f"[+] Reset auto-increment sequence for '{table_name}'")
        except Exception as seq_err:
            print(f"[i] Could not reset sequence for '{table_name}' (might not be serial PK): {seq_err}")

def main():
    print("=========================================================")
    print("         Sewain Microservice Database Migrator           ")
    print("=========================================================")
    print(f"Monolith DB: {MONOLITH_DB_URL}")
    print(f"Auth DB:     {AUTH_DB_URL}")
    print(f"Item DB:     {ITEM_DB_URL}")
    print(f"Rental DB:   {RENTAL_DB_URL}")
    print(f"Payment DB:  {PAYMENT_DB_URL}")
    print("=========================================================")
    
    # Initialize schemas first
    try:
        init_target_schemas()
    except Exception as e:
        print(f"[!] Schema initialization failed: {e}")
        print("[!] Please check if local databases are running.")
        sys.exit(1)
        
    # Connect to source database
    src_engine = create_engine(MONOLITH_DB_URL)
    
    try:
        with src_engine.connect() as src_conn:
            # Connect to targets
            auth_engine = create_engine(AUTH_DB_URL)
            item_engine = create_engine(ITEM_DB_URL)
            rental_engine = create_engine(RENTAL_DB_URL)
            payment_engine = create_engine(PAYMENT_DB_URL)
            
            # --- Migrate Auth DB ---
            print("\n>>> Migrating Auth Database tables...")
            migrate_table(src_conn, auth_engine, "users")
            migrate_table(src_conn, auth_engine, "admins")
            migrate_table(src_conn, auth_engine, "user_profiles")
            
            # --- Migrate Item DB ---
            print("\n>>> Migrating Item Database tables...")
            migrate_table(src_conn, item_engine, "categories")
            migrate_table(src_conn, item_engine, "items")
            
            # --- Migrate Rental DB ---
            print("\n>>> Migrating Rental Database tables...")
            migrate_table(src_conn, rental_engine, "promo_codes")
            migrate_table(src_conn, rental_engine, "rentals")
            migrate_table(src_conn, rental_engine, "reviews")
            migrate_table(src_conn, rental_engine, "promo_redemptions")
            
            # --- Migrate Payment DB ---
            print("\n>>> Migrating Payment Database tables...")
            migrate_table(src_conn, payment_engine, "payments")
            migrate_table(src_conn, payment_engine, "wallets")
            migrate_table(src_conn, payment_engine, "withdrawals")
            
            print("\n[+++] Migration Completed Successfully!")
            
    except Exception as e:
        print(f"\n[!] Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
