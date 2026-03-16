import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Platform, TextInput, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { FileText, Sparkles, FileUp, Info, Lock } from 'lucide-react-native';
import Colors from '../constants/Colors';

const LOADING_PHASES = [
  "Lettura del documento in corso...",
  "Estrazione dei concetti clinici...",
  "Generazione del riassunto..."
];

export default function Home() {
  const router = useRouter();
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
        }
      }
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleLogin = async () => {
    setAuthError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/verify-password', {
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
      Alert.alert('Errore', 'Impossibile selezionare il documento.');
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

      setLoadingTextIndex(0); // "Lettura del documento in corso..."

      // 1. Extract and Chunk Text
      const extractResponse = await fetch('http://localhost:3000/api/extract-text', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok || !extractData.chunks) {
        throw new Error(extractData.error || "Errore durante l'estrazione del testo.");
      }

      const chunks = extractData.chunks;
      let finalSummary = "";

      // 2. Process chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        // Update UI dynamically instead of timer
        setDynamicLoadingText(`Elaborazione frammento clinico ${i + 1} di ${chunks.length}...`);

        const sumResponse = await fetch('http://localhost:3000/api/summarize-chunk', {
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

        // Concatenate strictly as requested, no reduction.
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
      Alert.alert('Errore di Caricamento', error.message || "Si è verificato un errore durante il caricamento o l'elaborazione del PDF.");
      setLoading(false);
      setDynamicLoadingText(null);
    }
  };

  if (authChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.nursify.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.contentCard}>
          <View style={styles.iconContainer}>
            <View style={styles.glowEffect} />
            <Lock size={48} color={Colors.nursify.primary} />
          </View>

          <Text style={styles.title}>Accesso Protetto</Text>
          <Text style={styles.subtitle}>
            Inserisci la password di sistema per accedere a Nursify.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password..."
              placeholderTextColor={Colors.nursify.textLight}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
          </View>

          <View style={styles.checkboxContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: Colors.nursify.border, true: Colors.nursify.primaryLight }}
              thumbColor={rememberMe ? Colors.nursify.primary : '#f4f3f4'}
            />
            <Text style={styles.checkboxLabel}>Ricordami su questo dispositivo</Text>
          </View>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <TouchableOpacity style={[styles.actionButton, { marginTop: 16 }]} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.nursify.primary} />
            ) : (
              <Text style={styles.actionButtonText}>Accedi</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.guideButton} 
        onPress={() => router.push('/guida')}
        activeOpacity={0.8}
      >
        <Info size={20} color={Colors.nursify.textMain} />
        <Text style={styles.guideButtonText}>Come funziona</Text>
      </TouchableOpacity>

      <View style={styles.contentCard}>
        <View style={styles.iconContainer}>
            <View style={styles.glowEffect} />
            <FileText size={48} color={Colors.nursify.primary} />
            <Sparkles size={32} color={Colors.nursify.secondary} style={styles.stethoscopeIcon} />
        </View>

        <Text style={styles.title}>Nursify</Text>
        <Text style={styles.subtitle}>
          Il tuo assistente di studio. Carica i tuoi documenti PDF per ottenere riassunti strutturati e precisi per qualsiasi materia.
        </Text>

        {!loading ? (
          <TouchableOpacity style={styles.actionButton} onPress={handleDocumentSelection} activeOpacity={0.8}>
            <FileUp size={24} color={Colors.nursify.primary} style={{ marginRight: 12 }} />
            <Text style={styles.actionButtonText}>Seleziona il PDF (max 200MB)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.nursify.primary} />
            <Text style={styles.loadingText}>
               {dynamicLoadingText ? dynamicLoadingText : LOADING_PHASES[loadingTextIndex]}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nursify.background, // Pure Black
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  guideButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.nursify.border,
  },
  guideButtonText: {
    color: Colors.nursify.textMain,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  contentCard: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.nursify.card, // Off-black
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
    shadowColor: '#000',
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
    backgroundColor: Colors.nursify.calmTealLight, // Transparent opaque base
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)', // Luminous border
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 45,
    shadowColor: Colors.nursify.calmTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  stethoscopeIcon: {
    position: 'absolute',
    bottom: -5,
    right: -10,
    backgroundColor: Colors.nursify.background,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.nursify.textMain,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.nursify.textLight,
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
    backgroundColor: Colors.nursify.calmTealLight, // Ghost/Glassmorphism background
    borderWidth: 1,
    borderColor: Colors.nursify.calmTeal, // Bright Teal Border
    shadowColor: Colors.nursify.calmTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15, // Large glowing aura
    elevation: 8,
  },
  actionButtonText: {
    color: Colors.nursify.textMain, // White text for clarity
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
    color: Colors.nursify.primary,
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
    backgroundColor: Colors.nursify.background,
    borderWidth: 1,
    borderColor: Colors.nursify.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.nursify.textMain,
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
    color: Colors.nursify.textLight,
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  }
});
