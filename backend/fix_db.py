from sqlalchemy import text, inspect
from database import engine

def fix_schema():
    inspector = inspect(engine)
    
    # 1. Fix campus_news
    if 'campus_news' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('campus_news')]
        if 'published' not in columns:
            print("Adding 'published' column to campus_news...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE campus_news ADD published BIT DEFAULT 0"))
                conn.commit()
                print("Done.")
        else:
            print("'published' column already exists in campus_news.")
    else:
        print("Table 'campus_news' does not exist. create_all should handle it.")

    # 2. Fix campus_events (just in case)
    if 'campus_events' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('campus_events')]
        # Check for event_date
        if 'event_date' not in columns:
             print("Adding 'event_date' column to campus_events...")
             with engine.connect() as conn:
                conn.execute(text("ALTER TABLE campus_events ADD event_date DATETIME"))
                conn.commit()
                print("Done.")
    
    print("Schema check complete.")

if __name__ == "__main__":
    fix_schema()
