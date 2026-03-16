import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Stethoscope, FileText, Zap } from 'lucide-react-native';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function Guida() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header and Illustration Section */}
      <View style={styles.imageContainer}>
         <Image 
            source={{ uri: 'file:///C:/Users/samuc/.gemini/antigravity/brain/56f0704f-b08f-49a1-877c-a34bef9f1861/guida_introduttiva_torso_1773668249118.png' }}
            style={styles.illustration}
            resizeMode="contain"
         />
         <View style={styles.glowOverlay} />
      </View>

      <Text style={styles.title}>Come funziona Nursify</Text>
      <Text style={styles.subtitle}>
        L'intelligenza artificiale al servizio del tuo studio universitario.
      </Text>

      {/* Guide Steps */}
      <View style={styles.stepsContainer}>
        
        <View style={styles.stepCard}>
          <View style={styles.iconBox}>
            <FileText size={24} color={Colors.nursify.calmTeal} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>1. Carica il Documento</Text>
            <Text style={styles.stepDescription}>
              Seleziona un PDF lungo dalle tue dispense o libri. Anche i file più complessi verranno elaborati con precisione.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.iconBox}>
            <Zap size={24} color={Colors.nursify.softCoral} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>2. Estrazione Avanzata</Text>
            <Text style={styles.stepDescription}>
              Il "cervello" di Nursify analizza il testo estraendo concetti chiave, definizioni importanti, procedure e dati rilevanti per qualsiasi materia.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.iconBox}>
            <Stethoscope size={24} color={Colors.nursify.textMain} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>3. Studio Ottimizzato</Text>
            <Text style={styles.stepDescription}>
              Ottieni un riassunto strutturato in Markdown, perfetto per memorizzare e ripassare rapidamente su schermi mobili.
            </Text>
          </View>
        </View>
        
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.actionButtonText}>INIZIA A STUDIARE</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nursify.background, // Pure Black
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    maxWidth: 350,
    maxHeight: 350,
    marginTop: 20,
    marginBottom: 30,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  glowOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowColor: Colors.nursify.calmTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.nursify.textMain,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.nursify.textLight,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  stepsContainer: {
    width: '100%',
    maxWidth: 500,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.nursify.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.nursify.border,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.nursify.textMain,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.nursify.textLight,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 40,
    width: '100%',
    maxWidth: 500,
    height: 56,
    backgroundColor: Colors.nursify.calmTealLight, // transparent background effect
    borderWidth: 1,
    borderColor: Colors.nursify.calmTeal, // luminous border
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.nursify.calmTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    color: Colors.nursify.textMain, // White text for maximum contrast against pure black
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
