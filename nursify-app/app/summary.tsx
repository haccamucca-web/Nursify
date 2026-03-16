import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Paths, File } from 'expo-file-system';
import Markdown from 'react-native-markdown-display';
import { Copy, Save } from 'lucide-react-native';
import Colors from '../constants/Colors';

export default function SummaryScreen() {
  const params = useLocalSearchParams();
  const summaryText = params.summaryText as string || "Nessun riassunto disponibile.";

  const handleCopy = async () => {
    await Clipboard.setStringAsync(summaryText);
    Alert.alert("Copiato", "Il riassunto è stato copiato negli appunti.");
  };

  const handleSave = async () => {
    if (Platform.OS === 'web') {
      const blob = new Blob([summaryText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Nursify_Riassunto.txt';
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const fileName = `Nursify_Riassunto_${Date.now()}.txt`;
      const file = new File(Paths.document, fileName);
      
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(summaryText);
      
      const writableStream = file.writableStream();
      const writer = writableStream.getWriter();
      await writer.write(encodedText);
      await writer.close();
      
      Alert.alert(
        "Salvato",
        `Il file è stato salvato come:\n${fileName}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Errore", "Impossibile salvare il file.");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Risultato Riassunto' }} />
      <View style={styles.container}>
        <View style={styles.topActions}>
          <TouchableOpacity style={[styles.actionButton, styles.copyButton]} onPress={handleCopy} activeOpacity={0.7}>
            <Copy size={20} color={Colors.nursify.primary} />
            <Text style={styles.actionButtonText}>Copia Testo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave} activeOpacity={0.7}>
            <Save size={20} color={Colors.nursify.secondary} />
            <Text style={[styles.actionButtonText, { color: Colors.nursify.secondary }]}>Salva (TXT)</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Markdown style={markdownStyles}>
            {summaryText}
          </Markdown>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nursify.background,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.nursify.background, // Pure black or card dark
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 4,
    shadowColor: Colors.nursify.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  copyButton: {
    backgroundColor: Colors.nursify.primaryLight,
    borderColor: Colors.nursify.primary, // Luminous teal border
    shadowColor: Colors.nursify.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: Colors.nursify.secondaryLight,
    borderColor: Colors.nursify.secondary, // Soft coral border
    shadowColor: Colors.nursify.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  actionButtonText: {
    color: Colors.nursify.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  }
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 17,
    lineHeight: 28,
    color: Colors.nursify.textMain,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.nursify.primary, // Luminous Teal
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)', // Subdued border for pure black bg
    paddingBottom: 8,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.nursify.secondary, // Soft Coral
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    marginTop: 8,
    marginBottom: 16,
  },
  list_item: {
    marginVertical: 4,
  },
  bullet_list: {
    marginBottom: 16,
  },
  strong: {
    fontWeight: '700',
    color: Colors.nursify.textMain,
  },
  em: {
    fontStyle: 'italic',
    color: Colors.nursify.textLight,
  }
});
