import { useEffect, useState } from 'react'
import { api } from './api'
import type { ProductLookup } from './types'

// Mencari produk dari barcode (dengan jeda ketik) untuk mengisi nama, kategori, dan satuan di form.
export function useProductLookup(barcode: string) {
  const [state, setState] = useState<{ barcode: string; product: ProductLookup | null; error: string }>({
    barcode: '',
    product: null,
    error: '',
  })

  useEffect(() => {
    const code = barcode.trim()
    if (!code) return
    let cancelled = false
    const timer = setTimeout(() => {
      api<ProductLookup>(`/products/lookup?barcode=${encodeURIComponent(code)}`)
        .then((product) => !cancelled && setState({ barcode: code, product, error: '' }))
        .catch((e: Error) => !cancelled && setState({ barcode: code, product: null, error: e.message }))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [barcode])

  const current = state.barcode === barcode.trim() && barcode.trim() !== ''
  return { product: current ? state.product : null, error: current ? state.error : '' }
}
