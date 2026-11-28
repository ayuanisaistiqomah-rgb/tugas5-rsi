
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Flame,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Utensils,
  X,
  ShoppingCart,
  Minus,
} from 'lucide-react'
import {
  stallApi,
  menuApi,
  orderApi,
  getErrorMessage,
  isNotFound,
} from '../lib/api'
import { formatRupiah } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { canEditStall } from '../lib/permissions'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/ui'
import type { MenuItem, Stall, Order } from '../types/api'

export default function StallDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [stall, setStall] = useState<Stall | null>(null)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [menuName, setMenuName] = useState('')
  const [menuPrice, setMenuPrice] = useState('')
  const [menuAvailable, setMenuAvailable] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // State pemesanan
  const [cart, setCart] = useState<Record<number, number>>({})
  const [customerName, setCustomerName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<
    'transfer' | 'qris' | 'cash'
  >('qris')
  const [note, setNote] = useState('')
  const [orderError, setOrderError] = useState<string | null>(null)
  const [isOrdering, setIsOrdering] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadData(): Promise<void> {
      setIsLoading(true)
      setError(null)
      setNotFound(false)

      try {
        const [stallData, menuData] = await Promise.all([
          stallApi.detail(Number(id)),
          stallApi.menus(Number(id)),
        ])

        if (cancelled) return

        setStall(stallData)
        setMenus(menuData)
      } catch (caughtError) {
        if (cancelled) return

        if (isNotFound(caughtError)) setNotFound(true)
        else setError(getErrorMessage(caughtError))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  const canManageMenu = stall ? canEditStall(user, stall) : false
  const canRemoveMenu = user?.role === 'admin'
  const isCustomer = user?.role === 'customer'

  const selectedMenus = menus.filter(
    (menu) => (cart[menu.id] ?? 0) > 0 && menu.isAvailable,
  )

  const orderTotal = selectedMenus.reduce(
    (total, menu) => total + menu.price * cart[menu.id],
    0,
  )

  const totalItems = selectedMenus.reduce(
    (total, menu) => total + cart[menu.id],
    0,
  )

  function changeQuantity(menu: MenuItem, change: number): void {
    setCart((current) => {
      const nextQuantity = (current[menu.id] ?? 0) + change

      if (nextQuantity <= 0) {
        const updated = { ...current }
        delete updated[menu.id]
        return updated
      }

      return { ...current, [menu.id]: nextQuantity }
    })

    setOrderError(null)
  }

  function openAddForm(): void {
    setEditingMenu(null)
    setMenuName('')
    setMenuPrice('')
    setMenuAvailable(true)
    setFormError(null)
    setShowForm(true)
  }

  function openEditForm(menu: MenuItem): void {
    setEditingMenu(menu)
    setMenuName(menu.name)
    setMenuPrice(String(menu.price))
    setMenuAvailable(menu.isAvailable)
    setFormError(null)
    setShowForm(true)
  }

  function closeForm(): void {
    setShowForm(false)
    setEditingMenu(null)
    setFormError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setFormError(null)

    const price = Number(menuPrice)

    if (menuName.trim().length < 3) {
      setFormError('Nama menu minimal 3 karakter.')
      return
    }

    if (!Number.isInteger(price) || price < 0) {
      setFormError('Harga harus berupa bilangan bulat dan tidak boleh negatif.')
      return
    }

    setIsSaving(true)

    try {
      const input = {
        stallId: Number(id),
        name: menuName.trim(),
        price,
        isAvailable: menuAvailable,
      }

      if (editingMenu) {
        await menuApi.update(editingMenu.id, {
          name: input.name,
          price: input.price,
          isAvailable: input.isAvailable,
        })
      } else {
        await menuApi.create(input)
      }

      closeForm()
      setReloadKey((current) => current + 1)
    } catch (caughtError) {
      setFormError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(menu: MenuItem): Promise<void> {
    const confirmed = window.confirm(
      `Yakin ingin menghapus menu "${menu.name}"?`,
    )

    if (!confirmed) return

    setDeletingId(menu.id)

    try {
      await menuApi.remove(menu.id)
      setReloadKey((current) => current + 1)
    } catch (caughtError) {
      window.alert(getErrorMessage(caughtError))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCreateOrder(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setOrderError(null)

    if (selectedMenus.length === 0) {
      setOrderError('Pilih minimal satu menu terlebih dahulu.')
      return
    }

    if (customerName.trim().length < 2) {
      setOrderError('Nama pelanggan minimal 2 karakter.')
      return
    }

    if (phone.trim().length < 8 || phone.trim().length > 20) {
      setOrderError('Nomor HP harus terdiri dari 8 sampai 20 karakter.')
      return
    }

    setIsOrdering(true)

    try {
      const input = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        paymentMethod,
        note: note.trim() || undefined,
        items: selectedMenus.map((menu) => ({
          menuId: menu.id,
          quantity: cart[menu.id],
        })),
      }

      const result = await orderApi.create(input)

      setCreatedOrder(result)
      setCart({})
      setNote('')
    } catch (caughtError) {
      setOrderError(getErrorMessage(caughtError))
    } finally {
      setIsOrdering(false)
    }
  }

  if (isLoading) return <LoadingPanel message="Memuat detail warung..." />

  if (notFound) {
    return (
      <EmptyPanel
        title="Warung tidak ditemukan"
        description="Warung yang kamu cari tidak ada atau sudah dihapus."
        action={
          <Link to="/" className="text-sm font-bold text-brand">
            Kembali ke daftar
          </Link>
        }
      />
    )
  }

  if (error) {
    return (
      <ErrorPanel
        message={error}
        onRetry={() => setReloadKey((current) => current + 1)}
      />
    )
  }

  if (!stall) return null

  return (
    <div>
      <section className="relative overflow-hidden rounded-[2rem] bg-sky px-6 py-6 sm:px-8 sm:py-7">
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-52 w-52 rounded-full bg-white/50"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 right-1/3 h-40 w-40 rounded-full bg-amber-200/70"
          aria-hidden="true"
        />

        <div className="relative">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark transition hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Kembali ke daftar
          </Link>

          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
                {stall.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {stall.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink">
                    <MapPin size={14} aria-hidden="true" /> {stall.location}
                  </span>
                )}
                {stall.category && (
                  <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-amber-900">
                    {stall.category}
                  </span>
                )}
                {stall.isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-700">
                    <Flame size={14} aria-hidden="true" /> Populer
                  </span>
                )}
              </div>
            </div>

            <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full bg-amber-300 text-center text-ink">
              <span className="text-4xl font-extrabold leading-none">
                {stall.avgRating.toFixed(1)}
              </span>
              <span className="mt-1 text-xs font-medium">
                dari {stall.reviewCount} ulasan
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <article className="rounded-3xl bg-amber-200 p-6">
            <h2 className="text-sm font-bold text-amber-900">
              Tentang warung
            </h2>
            <p className="mt-1 text-lg font-semibold leading-snug text-ink">
              {stall.description ?? 'Belum ada deskripsi.'}
            </p>
          </article>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-white p-5">
              <p className="text-3xl font-extrabold text-ink">{menus.length}</p>
              <p className="text-sm text-brand-dark">menu</p>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <p className="text-3xl font-extrabold text-ink">
                {stall.reviewCount}
              </p>
              <p className="text-sm text-brand-dark">ulasan</p>
            </div>
          </div>

          {canEditStall(user, stall) && (
            <Link
              to={`/stalls/${stall.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              <Pencil size={15} aria-hidden="true" /> Ubah warung ini
            </Link>
          )}
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-[0_6px_0_0_theme(colors.sky)] lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky text-brand-dark">
                <Utensils size={18} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-extrabold text-ink">Menu</h2>
            </div>

            {canManageMenu && (
              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                <Plus size={16} aria-hidden="true" />
                Tambah menu
              </button>
            )}
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4 rounded-2xl border border-sky bg-sky/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-ink">
                  {editingMenu ? 'Ubah menu' : 'Tambah menu baru'}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full p-1 text-muted hover:bg-white"
                  aria-label="Tutup formulir"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
                  Nama menu
                </label>
                <input
                  type="text"
                  value={menuName}
                  onChange={(event) => setMenuName(event.target.value)}
                  minLength={3}
                  required
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  placeholder="Contoh: Nasi Goreng"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
                  Harga
                </label>
                <input
                  type="number"
                  value={menuPrice}
                  onChange={(event) => setMenuPrice(event.target.value)}
                  min={0}
                  step={1}
                  required
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  placeholder="Contoh: 15000"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={menuAvailable}
                  onChange={(event) => setMenuAvailable(event.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                Menu tersedia
              </label>

              {formError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink transition hover:bg-border"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {menus.length === 0 ? (
            <div className="mt-4">
              <EmptyPanel
                title="Belum ada menu"
                description="Warung ini belum menambahkan menu."
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {menus.map((menu, index) => (
                <li
                  key={menu.id}
                  className="flex flex-wrap items-center gap-3 text-base"
                >
                  <span
                    className={
                      menu.isAvailable
                        ? 'font-medium text-ink'
                        : 'text-muted line-through'
                    }
                  >
                    {menu.name}
                  </span>

                  <span
                    className="min-w-6 flex-1 border-b-2 border-dotted border-ink/20"
                    aria-hidden="true"
                  />

                  {!menu.isAvailable && (
                    <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                      Habis
                    </span>
                  )}

                  <span
                    className={`shrink-0 rounded-lg px-3 py-1 text-sm font-bold ${
                      index % 2 === 0
                        ? 'bg-sky text-brand-dark'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {formatRupiah(menu.price)}
                  </span>

                  {isCustomer && menu.isAvailable && (
                    <div className="flex items-center gap-2 rounded-xl bg-sky/30 p-1">
                      <button
                        type="button"
                        onClick={() => changeQuantity(menu, -1)}
                        className="rounded-lg p-1.5 text-brand-dark hover:bg-white"
                        aria-label={`Kurangi ${menu.name}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="min-w-5 text-center text-sm font-bold">
                        {cart[menu.id] ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(menu, 1)}
                        className="rounded-lg p-1.5 text-brand-dark hover:bg-white"
                        aria-label={`Tambah ${menu.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}

                  {(canManageMenu || canRemoveMenu) && (
                    <div className="flex items-center gap-1">
                      {canManageMenu && (
                        <button
                          type="button"
                          onClick={() => openEditForm(menu)}
                          className="rounded-lg p-2 text-brand hover:bg-sky"
                          title="Ubah menu"
                          aria-label={`Ubah ${menu.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                      )}

                      {canRemoveMenu && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(menu)}
                          disabled={deletingId === menu.id}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Hapus menu"
                          aria-label={`Hapus ${menu.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {isCustomer && (
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-[0_6px_0_0_theme(colors.amber.200)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
              <ShoppingCart size={19} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-ink">
                Pesan Menu
              </h2>
              <p className="text-sm text-muted">
                Pilih menu dan isi data untuk membuat pesanan.
              </p>
            </div>
          </div>

          {createdOrder ? (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
              <h3 className="text-lg font-extrabold text-green-800">
                Pesanan berhasil dibuat!
              </h3>
              <p className="mt-2 text-sm text-green-800">
                Kode pesanan: <strong>{createdOrder.orderCode}</strong>
              </p>
              <p className="mt-1 text-sm text-green-800">
                Total pembayaran: <strong>{formatRupiah(createdOrder.total)}</strong>
              </p>
              <p className="mt-1 text-sm text-green-800">
                Status: <strong>{createdOrder.status}</strong>
              </p>

              <div className="mt-4 border-t border-green-200 pt-3">
                <p className="font-bold text-green-900">Rincian pesanan</p>
                {createdOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="mt-2 flex justify-between gap-3 text-sm text-green-900"
                  >
                    <span>
                      {item.menuName} x {item.quantity}
                    </span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCreatedOrder(null)}
                className="mt-4 rounded-full bg-green-700 px-5 py-2 text-sm font-bold text-white hover:bg-green-800"
              >
                Buat pesanan lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateOrder} className="mt-5 space-y-5">
              <div className="rounded-2xl bg-sky/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-ink">Ringkasan keranjang</p>
                  <span className="text-sm text-brand-dark">
                    {totalItems} item
                  </span>
                </div>

                {selectedMenus.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">
                    Belum ada menu yang dipilih. Gunakan tombol + pada menu di atas.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {selectedMenus.map((menu) => (
                      <div
                        key={menu.id}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="text-ink">
                          {menu.name} x {cart[menu.id]}
                        </span>
                        <span className="font-semibold text-ink">
                          {formatRupiah(menu.price * cart[menu.id])}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex justify-between border-t border-sky pt-3">
                  <span className="font-bold text-ink">Total</span>
                  <span className="text-lg font-extrabold text-brand-dark">
                    {formatRupiah(orderTotal)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">
                    Nama pelanggan
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    minLength={2}
                    maxLength={80}
                    required
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand"
                    placeholder="Nama pelanggan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">
                    Nomor HP
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    minLength={8}
                    maxLength={20}
                    required
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
                  Metode pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value as 'transfer' | 'qris' | 'cash',
                    )
                  }
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="qris">QRIS</option>
                  <option value="transfer">Transfer</option>
                  <option value="cash">Tunai</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
                  Catatan (opsional)
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand"
                  placeholder="Contoh: Tidak pedas, sambal dipisah."
                />
              </div>

              {orderError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {orderError}
                </p>
              )}

              <button
                type="submit"
                disabled={isOrdering || selectedMenus.length === 0}
                className="w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isOrdering ? 'Memproses pesanan...' : 'Buat Pesanan'}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
