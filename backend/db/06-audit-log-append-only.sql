
USE review_kantin;
GO

-- 1. Menambahkan kolom audit jika belum tersedia
IF COL_LENGTH('dbo.AUDIT_LOGS', 'ip_address') IS NULL
BEGIN
    ALTER TABLE dbo.AUDIT_LOGS
    ADD ip_address NVARCHAR(45) NULL;
END
GO

IF COL_LENGTH('dbo.AUDIT_LOGS', 'user_agent') IS NULL
BEGIN
    ALTER TABLE dbo.AUDIT_LOGS
    ADD user_agent NVARCHAR(1000) NULL;
END
GO

IF COL_LENGTH('dbo.AUDIT_LOGS', 'result') IS NULL
BEGIN
    ALTER TABLE dbo.AUDIT_LOGS
    ADD result NVARCHAR(20) NULL;
END
GO

-- 2. Membuat trigger append-only
CREATE OR ALTER TRIGGER dbo.trg_AUDIT_LOGS_Prevent_Update_Delete
ON dbo.AUDIT_LOGS
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    THROW 50001,
        'AUDIT_LOGS bersifat append-only. UPDATE dan DELETE tidak diperbolehkan.',
        1;
END
GO

-- 3. Membatasi hak akses akun aplikasi
GRANT SELECT, INSERT
ON OBJECT::dbo.AUDIT_LOGS
TO [praktikum_user];
GO

DENY UPDATE, DELETE
ON OBJECT::dbo.AUDIT_LOGS
TO [praktikum_user];
GO

PRINT 'AUDIT_LOGS berhasil dilengkapi dengan aturan append-only.';
GO
