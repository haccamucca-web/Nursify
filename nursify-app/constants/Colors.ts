const tintColorLight = '#0B7BC1'; // Clean Medical Blue
const tintColorDark = '#00E5FF'; // Luminous Teal

export default {
  light: {
    textMain: '#1e293b',
    textLight: '#64748b',
    background: '#f8fafc',
    card: '#ffffff',
    primary: tintColorLight,
    primaryLight: 'rgba(11, 123, 193, 0.1)',
    secondary: '#ff6b6b',
    secondaryLight: 'rgba(255, 107, 107, 0.1)',
    border: '#e2e8f0',
    icon: '#1e293b',
  },
  dark: {
    textMain: '#f8fafc',
    textLight: '#94a3b8',
    background: '#0f172a',
    card: '#1e293b',
    primary: tintColorDark,
    primaryLight: 'rgba(0, 229, 255, 0.1)',
    secondary: '#FF8A65',
    secondaryLight: 'rgba(255, 138, 101, 0.1)',
    border: '#334155',
    icon: '#f8fafc',
  },
  // Fallback for legacy components until updated
  nursify: {
    primary: tintColorDark,
    primaryLight: 'rgba(0, 229, 255, 0.1)',
    secondary: '#FF8A65',
    secondaryLight: 'rgba(255, 138, 101, 0.1)',
    background: '#0f172a',
    card: '#1e293b',
    textMain: '#f8fafc',
    textLight: '#94a3b8',
    border: '#334155',
    calmTeal: tintColorDark,
    calmTealLight: 'rgba(0, 229, 255, 0.1)',
    softCoral: '#FF8A65',
  }
};
