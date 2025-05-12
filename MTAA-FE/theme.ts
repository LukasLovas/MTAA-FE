// theme.ts - s upravenými typmi
import { DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme, Theme as NavigationTheme } from '@react-navigation/native';

// Rozšírenie typu Theme z @react-navigation/native o naše vlastnosti
export interface Theme extends NavigationTheme {
  dark: boolean;
  highContrast?: boolean;
  fontSize?: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    xxlarge: number;
  }
}

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
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    xxlarge: 20,
  }
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
  fontSize: {
    small: 12,
    medium: 14, 
    large: 16,
    xlarge: 18,
    xxlarge: 20,
  }
};

export const HighContrastTheme: Theme = {
  ...NavigationLightTheme,
  dark: false,
  highContrast: true,
  colors: {
    ...NavigationLightTheme.colors,
    background: '#000000',
    card: '#000000',
    text: '#FFFFFF',
    primary: '#FFFF00',
    border: '#FFFFFF',
    notification: '#FF0000',
  },
  fontSize: {
    small: 16,
    medium: 18,
    large: 20,
    xlarge: 22,
    xxlarge: 24,
  }
};