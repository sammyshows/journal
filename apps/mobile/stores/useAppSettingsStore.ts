import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'
import { lightTheme, darkTheme, Theme } from '../theme'

type ThemeMode = 'light' | 'dark' | 'system'

interface AppSettingsState {
  themeMode: ThemeMode
  theme: Theme
  setThemeMode: (mode: ThemeMode) => void
  loadThemeFromStorage: () => Promise<void>
}

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  themeMode: 'system',
  theme: Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme,

  setThemeMode: async (mode) => {
    await AsyncStorage.setItem('themeMode', mode)

    const resolvedTheme =
      mode === 'dark' ? darkTheme :
      mode === 'light' ? lightTheme :
      Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme

    set({ themeMode: mode, theme: resolvedTheme })
  },

  loadThemeFromStorage: async () => {
    const saved = await AsyncStorage.getItem('themeMode')
    const mode = (saved || 'system') as ThemeMode

    const resolvedTheme =
      mode === 'dark' ? darkTheme :
      mode === 'light' ? lightTheme :
      Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme

    set({ themeMode: mode, theme: resolvedTheme })
  }
}))
