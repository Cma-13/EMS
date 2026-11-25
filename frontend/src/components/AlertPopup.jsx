import React, { useEffect, useState } from 'react'
import { FaInfoCircle } from 'react-icons/fa'

// In-app replacement for the browser's alert() popup.
// Usage anywhere: showAlert('Something went wrong')
// <AlertHost /> is placed once in App.jsx and shows the popup.

let listener = null

export const showAlert = (message, title = 'Notice') => {
    if (listener) listener({ message: String(message), title })
}

export const AlertHost = () => {
    const [popup, setPopup] = useState(null)

    useEffect(() => {
        listener = setPopup
        return () => { listener = null }
    }, [])

    if (!popup) return null
    const close = () => setPopup(null)

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={close} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FaInfoCircle className="text-teal-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-stone-800">{popup.title}</h3>
                        <p className="text-sm text-stone-500 mt-0.5">{popup.message}</p>
                    </div>
                </div>
                <button onClick={close} autoFocus
                    className="w-full mt-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition">
                    OK
                </button>
            </div>
        </div>
    )
}
