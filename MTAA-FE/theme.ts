import { DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme, Theme } from '@react-navigation/native';

export const LightTheme: Theme = {
  ...NavigationLightTheme,
  dark: false,
  colors: {
    ...NavigationLightTheme.colors,
    background: '#FFFFFF',
    card: '#F0F0F0',
    text: '#000000',
    primary: '#2B2B2B',
    border: '#E0E0E0',
    notification: '#FF4D4D',
  },
};

export const DarkTheme: Theme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    primary: '#FFFFFF',
    border: '#333333',
    notification: '#FF4D4D',
  },
};
