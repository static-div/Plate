import { createContext, type Dispatch, type SetStateAction } from 'react'

export const SelectedDateContext = createContext<[string, Dispatch<SetStateAction<string>>] | null>(null)
