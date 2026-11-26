import React from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

// Page numbers to show: always first and last, the current page and its neighbours, '…' for gaps
const pageList = (page, pages) => {
    const set = new Set([1, pages, page - 1, page, page + 1].filter(p => p >= 1 && p <= pages))
    const sorted = [...set].sort((a, b) => a - b)
    const out = []
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) out.push('…' + p)
        out.push(p)
    })
    return out
}

// Footer bar: "Showing 11–20 of 43"  ‹ 1 2 3 … 5 ›
const Pagination = ({ page, pages, total, pageSize, onChange, label = 'records' }) => {
    if (!total) return null
    const from = (page - 1) * pageSize + 1
    const to   = Math.min(page * pageSize, total)
    const btn  = 'min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition'

    return (
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-stone-400">
                Showing <b className="text-stone-600">{from}–{to}</b> of <b className="text-stone-600">{total}</b> {label}
            </p>
            {pages > 1 && (
                <div className="flex items-center gap-1">
                    <button onClick={() => onChange(page - 1)} disabled={page === 1} title="Previous page"
                        className={`${btn} text-stone-500 hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent`}>
                        <FaChevronLeft className="mx-auto text-[10px]" />
                    </button>
                    {pageList(page, pages).map(p => typeof p === 'string'
                        ? <span key={p} className="px-1 text-stone-300 text-xs">…</span>
                        : <button key={p} onClick={() => onChange(p)}
                            className={`${btn} ${p === page ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-200'}`}>{p}</button>
                    )}
                    <button onClick={() => onChange(page + 1)} disabled={page === pages} title="Next page"
                        className={`${btn} text-stone-500 hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent`}>
                        <FaChevronRight className="mx-auto text-[10px]" />
                    </button>
                </div>
            )}
        </div>
    )
}

export default Pagination
