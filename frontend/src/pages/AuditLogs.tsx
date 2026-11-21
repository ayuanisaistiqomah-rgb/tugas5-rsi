
import { useEffect, useState } from 'react'
import { auditLogApi, getErrorMessage } from '../lib/api'
import type {
  AuditLog,
  AuditLogQuery,
  AuditLogPagination,
} from '../types/api'
import { useAuth } from '../context/AuthContext'
import { LoadingPanel, ErrorPanel, EmptyPanel } from '../components/ui'

export default function AuditLogs() {
  const { user } = useAuth()

  const [items, setItems] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<AuditLogPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [filters, setFilters] = useState({
    action: '',
    targetTable: '',
    targetId: '',
    userId: '',
    from: '',
    to: '',
  })

  const [page, setPage] = useState(1)
  const pageSize = 10

  async function loadAuditLogs() {
    try {
      setLoading(true)
      setError('')

      const params: AuditLogQuery = {
        page,
        pageSize,
      }

      if (filters.action) params.action = filters.action
      if (filters.targetTable) params.targetTable = filters.targetTable
      if (filters.targetId) params.targetId = Number(filters.targetId)
      if (filters.userId) params.userId = Number(filters.userId)
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to

      const result = await auditLogApi.list(params)

      setItems(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLogs()
  }, [page])

  function handleFilter() {
    setPage(1)
    loadAuditLogs()
  }

  function handleReset() {
    setFilters({
      action: '',
      targetTable: '',
      targetId: '',
      userId: '',
      from: '',
      to: '',
    })
    setPage(1)
    setTimeout(() => {
      loadAuditLogsWithEmptyFilters()
    }, 0)
  }

  async function loadAuditLogsWithEmptyFilters() {
    try {
      setLoading(true)
      setError('')

      const result = await auditLogApi.list({
        page: 1,
        pageSize,
      })

      setItems(result.items)
      setPagination(result.pagination)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function openDetail(id: number) {
    try {
      setDetailLoading(true)
      const detail = await auditLogApi.detail(id)
      setSelectedLog(detail)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString('id-ID')
  }

  if (user?.role !== 'admin') {
    return <ErrorPanel message="Halaman ini hanya dapat diakses oleh Admin." />
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-brand-dark">
          Administrasi
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink">
          Audit Logs
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Riwayat aktivitas pengguna dalam sistem Review Kantin.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-ink">Filter Audit Logs</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm font-semibold">
            Action
            <input
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
              placeholder="Contoh: LOGIN"
              className="w-full rounded-xl border border-border px-3 py-2 font-normal"
            />
          </label>

          <label className="space-y-1 text-sm font-semibold">
            Target Table
            <input
              value={filters.targetTable}
              onChange={(e) =>
                setFilters({ ...filters, targetTable: e.target.value })
              }
              placeholder="Contoh: USERS"
              className="w-full rounded-xl border border-border px-3 py-2 font-normal"
            />
          </label>

          <label className="space-y-1 text-sm font-semibold">
            Target ID
            <input
              type="number"
              min="1"
              value={filters.targetId}
              onChange={(e) =>
                setFilters({ ...filters, targetId: e.target.value })
              }
              placeholder="ID target"
              className="w-full rounded-xl border border-border px-3 py-2 font-normal"
            />
          </label>

          <label className="space-y-1 text-sm font-semibold">
            User ID
            <input
              type="number"
              min="1"
              value={filters.userId}
              onChange={(e) =>
                setFilters({ ...filters, userId: e.target.value })
              }
              placeholder="ID pengguna"
              className="w-full rounded-xl border border-border px-3 py-2 font-normal"
            />
          </label>

          <label className="space-y-1 text-sm font-semibold">
            Dari Tanggal
            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters({ ...filters, from: e.target.value })
              }
              className="w-full rounded-xl border border-border px-3 py-2 font-normal"
            />
          </label>

          <label className="space-y-1 text-sm font-semibold">
            Sampai Tanggal
            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters({ ...filters, to: e.target.value })
              }
              className="w-full rounded-xl border border-border px-3 py-2 font-normal"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleFilter}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Terapkan Filter
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-ink hover:bg-sun-soft"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-bold text-ink">Daftar Aktivitas</h2>
          {pagination && (
            <p className="mt-1 text-sm text-text-muted">
              Total {pagination.total} aktivitas
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-5">
            <LoadingPanel message="Memuat audit logs..." />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorPanel message={error} />
            <button
              type="button"
              onClick={loadAuditLogs}
              className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyPanel title="Belum ada aktivitas yang sesuai dengan filter." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sun-soft text-ink">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Hasil</th>
                  <th className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.userName ?? '-'}</p>
                      <p className="text-xs text-text-muted">
                        {item.userEmail ?? `ID: ${item.userId}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{item.action}</td>
                    <td className="px-4 py-3">
                      {item.targetTable} #{item.targetId}
                    </td>
                    <td className="px-4 py-3">{item.result ?? '-'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(item.id)}
                        className="font-bold text-brand-dark hover:underline"
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Sebelumnya
            </button>

            <span className="text-sm font-semibold">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        )}
      </section>

      {detailLoading && (
        <div className="rounded-xl border border-border bg-white p-4">
          <LoadingPanel message="Memuat detail aktivitas..." />
        </div>
      )}

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-ink">
                Detail Audit #{selectedLog.id}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg px-3 py-1 font-bold hover:bg-sun-soft"
              >
                Tutup
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Pengguna" value={selectedLog.userName ?? '-'} />
              <DetailField label="Email" value={selectedLog.userEmail ?? '-'} />
              <DetailField label="Action" value={selectedLog.action} />
              <DetailField label="Target Table" value={selectedLog.targetTable} />
              <DetailField label="Target ID" value={String(selectedLog.targetId)} />
              <DetailField label="Hasil" value={selectedLog.result ?? '-'} />
              <DetailField label="Waktu" value={formatDate(selectedLog.createdAt)} />
              <DetailField label="IP Address" value={selectedLog.ipAddress ?? '-'} />
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1 text-sm font-bold text-ink">User Agent</p>
                <p className="break-all rounded-xl bg-sun-soft p-3 text-sm">
                  {selectedLog.userAgent ?? '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-ink">Metadata</p>
                <pre className="overflow-x-auto rounded-xl bg-sun-soft p-3 text-sm">
                  {selectedLog.metadata
                    ? (() => {
                        try {
                          return JSON.stringify(
                            JSON.parse(selectedLog.metadata),
                            null,
                            2,
                          )
                        } catch {
                          return selectedLog.metadata
                        }
                      })()
                    : '-'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 break-words rounded-xl bg-sun-soft p-3 text-sm font-medium text-ink">
        {value}
      </p>
    </div>
  )
}
