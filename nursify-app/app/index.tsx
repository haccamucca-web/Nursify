import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, TextInput, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { FileText, Sparkles, FileUp, Info, Lock, Sun, Moon } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTheme } from './_layout';

const LOADING_PHASES = [
  "Lettura del documento in corso...",
  "Estrazione dei concetti clinici...",
  "Generazione del riassunto..."
];

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [dynamicLoadingText, setDynamicLoadingText] = useState<string | null>(null);

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState('');

  // Check Storage on Mount
  useEffect(() => {
    const checkAuth = async () => {
      if (Platform.OS === 'web') {
        const localAuth = localStorage.getItem('nursify_auth');
        const sessionAuth = sessionStorage.getItem('nursify_auth');
        
        if (localAuth === 'true' || sessionAuth === 'true') {
          setIsAuthenticated(true);
          setAuthChecking(false);
          return;
        }
      }
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading && !dynamicLoadingText) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading, dynamicLoadingText]);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  const handleLogin = async () => {
    setAuthError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        if (Platform.OS === 'web') {
          if (rememberMe) {
            localStorage.setItem('nursify_auth', 'true');
          } else {
            sessionStorage.setItem('nursify_auth', 'true');
          }
        }
      } else {
        setAuthError(data.error || 'Password errata');
      }
    } catch (error) {
      setAuthError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        setLoadingTextIndex(0);
        await uploadAndSummarize(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document', err);
      Toast.show({
        type: 'error',
        text1: 'Oops!',
        text2: 'Impossibile selezionare il documento.',
      });
    }
  };

  const uploadAndSummarize = async (file: DocumentPicker.DocumentPickerAsset) => {
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('pdf', blob, file.name);
      } else {
        formData.append('pdf', {
          uri: file.uri,
          name: file.name,
          type: 'application/pdf',
        } as any);
      }

      setLoadingTextIndex(0);
      setDynamicLoadingText(null);

      // 1. Extract and Chunk Text
      const extractResponse = await fetch(`${API_BASE_URL}/api/extract-text`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok || !extractData.chunks) {
        throw new Error(extractData.error || "Errore durante l'estrazione del testo. Potrebbe essere un PDF scannerizzato (composto da sole immagini).");
      }

      if (extractData.chunks.length === 0) {
        throw new Error("Impossibile leggere il testo. Assicurati che non sia un PDF scannerizzato o una semplice immagine.");
      }

      const chunks = extractData.chunks;
      let finalSummary = "";

      // 2. Process chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        setDynamicLoadingText(`Elaborazione frammento clinico ${i + 1} di ${chunks.length}...`);

        const sumResponse = await fetch(`${API_BASE_URL}/api/summarize-chunk`, {
            method: 'POST',
            body: JSON.stringify({ chunk: chunks[i], index: i + 1, total: chunks.length }),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
        });

        const sumData = await sumResponse.json();
        
        if (!sumResponse.ok || !sumData.summary) {
            throw new Error(sumData.error || `Errore nell'elaborazione del frammento ${i+1}.`);
        }

        finalSummary += sumData.summary + "\n\n---\n\n";
      }

      setLoading(false);
      setDynamicLoadingText(null);
      
      router.push({
        pathname: '/summary',
        params: { summaryText: finalSummary.trim() }
      });

    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Errore di Caricamento',
        text2: error.message || "Si è verificato un errore durante l'elaborazione del PDF.",
        visibilityTime: 6000,
      });
      setLoading(false);
      setDynamicLoadingText(null);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    topBar: {
      position: 'absolute',
      top: 20,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      zIndex: 10,
    },
    iconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconButtonText: {
      color: colors.textMain,
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
    },
    contentCard: {
      width: '100%',
      maxWidth: 500,
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: theme === 'dark' ? '#000' : colors.primaryLight,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 30,
      elevation: 20,
    },
    iconContainer: {
      position: 'relative',
      marginBottom: 24,
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    glowEffect: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 45,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 15,
    },
    stethoscopeIcon: {
      position: 'absolute',
      bottom: -5,
      right: -10,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 32,
      fontWeight: '900',
      color: colors.textMain,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: 40,
      lineHeight: 24,
    },
    actionButton: {
      height: 56,
      paddingHorizontal: 32,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 8,
    },
    actionButtonText: {
      color: theme === 'dark' ? '#FFFFFF' : colors.primary,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 1,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      width: '100%',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 15,
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
      marginBottom: 16,
    },
    input: {
      width: '100%',
      height: 56,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.textMain,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 8,
    },
    checkboxLabel: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.textLight,
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: 14,
      marginTop: 4,
      marginBottom: 8,
      textAlign: 'center',
      fontWeight: '600',
    }
  });

  if (authChecking) {
    return (
      <View style={dynamicStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={dynamicStyles.container}>
        <Animated.View entering={FadeIn.duration(500)} style={dynamicStyles.contentCard}>
          <View style={dynamicStyles.iconContainer}>
            <View style={dynamicStyles.glowEffect} />
            <Lock size={48} color={colors.primary} />
          </View>

          <Text style={dynamicStyles.title}>Accesso Protetto</Text>
          <Text style={dynamicStyles.subtitle}>
            Inserisci la password di sistema per accedere a Nursify.
          </Text>

          <View style={dynamicStyles.inputContainer}>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Password..."
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
          </View>

          <View style={dynamicStyles.checkboxContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={rememberMe ? colors.primary : '#f4f3f4'}
            />
            <Text style={dynamicStyles.checkboxLabel}>Ricordami su questo dispositivo</Text>
          </View>

          {authError ? <Text style={dynamicStyles.errorText}>{authError}</Text> : null}

          <TouchableOpacity style={[dynamicStyles.actionButton, { marginTop: 16 }]} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={dynamicStyles.actionButtonText}>Accedi</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.topBar}>
        <TouchableOpacity 
          style={dynamicStyles.iconButton} 
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          {theme === 'dark' ? <Sun size={20} color={colors.textLight} /> : <Moon size={20} color={colors.textMain} />}
          <Text style={dynamicStyles.iconButtonText}>{theme === 'dark' ? 'Chiaro' : 'Scuro'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={dynamicStyles.iconButton} 
          onPress={() => router.push('/guida')}
          activeOpacity={0.8}
        >
          <Info size={20} color={colors.textMain} />
          <Text style={dynamicStyles.iconButtonText}>Guida</Text>
        </TouchableOpacity>
      </View>

      <Animated.View entering={FadeIn.duration(600)} style={dynamicStyles.contentCard}>
        <View style={dynamicStyles.iconContainer}>
            <View style={dynamicStyles.glowEffect} />
            <FileText size={48} color={colors.primary} />
            <Sparkles size={32} color={colors.secondary} style={dynamicStyles.stethoscopeIcon} />
        </View>

        <Text style={dynamicStyles.title}>Nursify</Text>
        <Text style={dynamicStyles.subtitle}>
          Il tuo assistente di studio. Carica documenti PDF per ottenere riassunti strutturati e precisi per qualsiasi materia.
        </Text>

        {!loading ? (
          <Animated.View exiting={FadeOut} style={{ width: '100%' }}>
            <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleDocumentSelection} activeOpacity={0.8}>
              <FileUp size={24} color={theme === 'dark' ? '#FFFFFF' : colors.primary} style={{ marginRight: 12 }} />
              <Text style={dynamicStyles.actionButtonText}>Seleziona il PDF</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Animated.Text key={dynamicLoadingText || loadingTextIndex} entering={FadeIn} exiting={FadeOut} style={dynamicStyles.loadingText}>
               {dynamicLoadingText ? dynamicLoadingText : LOADING_PHASES[loadingTextIndex]}
            </Animated.Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
