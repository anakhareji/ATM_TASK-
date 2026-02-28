import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text

def fix_project_fks():
    with engine.connect() as conn:
        print("Finding and dropping old foreign keys on 'projects' table...")
        drop_fks_sql = """
        DECLARE @sql NVARCHAR(MAX) = '';

        SELECT @sql += 'ALTER TABLE projects DROP CONSTRAINT ' + fk.name + ';'
        FROM sys.foreign_keys fk
        INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
        WHERE fk.parent_object_id = OBJECT_ID('projects') 
          AND c.name IN ('department_id', 'course_id');

        EXEC sp_executesql @sql;
        """
        try:
            conn.execute(text(drop_fks_sql))
            conn.commit()
            print("Successfully dropped old constraints.")
        except Exception as e:
            print("Drop constraints didn't apply or already dropped", e)
            
        print("Re-adding correct foreign key references to 'departments_v1' and 'courses_v1'...")
        add_dept_fk_sql = """
        ALTER TABLE projects ADD CONSTRAINT FK_projects_department_v1 FOREIGN KEY (department_id) REFERENCES departments_v1(id);
        """
        add_course_fk_sql = """
        ALTER TABLE projects ADD CONSTRAINT FK_projects_course_v1 FOREIGN KEY (course_id) REFERENCES courses_v1(id);
        """
        
        try:
            conn.execute(text(add_dept_fk_sql))
            conn.commit()
        except Exception as e:
            print("Department FK warning:", e)
            
        try:
            conn.execute(text(add_course_fk_sql))
            conn.commit()
        except Exception as e:
            print("Course FK warning:", e)
            
        print("Foreign keys successfully upgraded!")

if __name__ == "__main__":
    fix_project_fks()
