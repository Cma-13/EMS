import { useMemo, useState } from 'react'

// Client-side paging for a list that is already loaded.
// Goes back to page 1 whenever `resetKey` changes (e.g. the search text or a filter).
export const usePagination = (items, pageSize = 10, resetKey = '') => {
    const [state, setState] = useState({ page: 1, key: resetKey })
    const total = items?.length || 0
    const pages = Math.max(1, Math.ceil(total / pageSize))

    // A new search/filter means page 1; never past the last page (e.g. after a delete)
    const requested = state.key === resetKey ? state.page : 1
    const page = Math.min(requested, pages)
    const setPage = (p) => setState({ page: Math.max(1, Math.min(p, pages)), key: resetKey })

    const pageItems = useMemo(
        () => (items || []).slice((page - 1) * pageSize, page * pageSize),
        [items, page, pageSize]
    )
    const offset = (page - 1) * pageSize   // add to a row's index for a running "#" number

    return { page, setPage, pages, total, pageItems, offset, pageSize }
}
