export type Theme = typeof lightTheme;

export const lightTheme = {
  name: 'light',
  background: '#FDF8F3',       // warm off-white parchment
  surface: '#FFFFFF',
  primary: '#035afc',
  secondary: '#FFB997',           // soft peach
  text: '#222222',
  secondaryText: '#555555',
  muted: '#999999',
  border: '#E3DED7',
  emotionTag: '#C1DFF0',       // pastel blue
  highlight: '#FBEEC1',        // soft yellow highlight
};

export const darkTheme = {
  name: 'dark',
  background: '#0E0E0E',       // soft inky black
  primary: '#035afc',
  secondary: '#FF9F80',           // warm coral
  surface: '#1A1A1A',
  text: '#F2F2F2',
  secondaryText: '#B5B5B5',
  muted: '#777777',
  border: '#333333',
  emotionTag: '#6E9BC5',       // muted dusty blue
  highlight: '#3D2E1E',        // warm shadowy amber
};
