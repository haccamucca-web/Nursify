import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Paths, File } from 'expo-file-system';
import Markdown from 'react-native-markdown-display';
import { Copy, Save, FileDown } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { marked } from 'marked';
import { useTheme } from './_layout';

const { width } = Dimensions.get('window');
const isTabletOrWeb = width > 768;

export default function SummaryScreen() {
  const params = useLocalSearchParams();
  const summaryText = params.summaryText as string || "Nessun riassunto disponibile.";
  const { theme, colors } = useTheme();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(summaryText);
    Toast.show({
      type: 'success',
      text1: 'Copiato!',
      text2: 'Il riassunto è stato copiato negli appunti.',
    });
  };

  const handleSaveTXT = async () => {
    if (Platform.OS === 'web') {
      const blob = new Blob([summaryText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Nursify_Riassunto.txt';
      link.click();
      URL.revokeObjectURL(url);
      
      Toast.show({ type: 'success', text1: 'Salvato', text2: 'File TXT scaricato.' });
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
      
      Toast.show({
        type: 'success',
        text1: 'Salvato',
        text2: `File salvato in Documenti:\n${fileName}`,
      });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Errore', text2: 'Impossibile salvare il file.' });
    }
  };

  const handleExportPDF = async () => {
    try {
      const htmlContent = marked.parse(summaryText);
      
      const htmlTemplate = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              color: #1e293b; 
              padding: 40px; 
              line-height: 1.6; 
              background-color: #ffffff;
            }
            h1, h2 { color: #00E5FF; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px; font-weight: 800; }
            h3 { color: #FF8A65; margin-top: 20px; font-weight: 700; }
            p { font-size: 16px; margin: 12px 0; color: #334155; }
            strong { font-weight: 700; color: #0f172a; }
            ul, ol { margin: 12px 0; padding-left: 24px; color: #334155; }
            li { margin-bottom: 8px; }
            hr { border: none; border-top: 1px dashed #cbd5e1; margin: 30px 0; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #00E5FF; border: none; font-size: 32px; font-weight: 900; margin-bottom: 5px; }
            .header p { color: #64748b; font-size: 14px; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Nursify</h1>
            <p>Riassunto Clinico Generato dall'IA</p>
          </div>
          ${htmlContent}
        </body>
      </html>
      `;

      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.document?.open();
        iframe.document?.write(htmlTemplate);
        iframe.document?.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
        }, 500);
        
        Toast.show({ type: 'success', text1: 'Stampa', text2: 'Preparazione PDF in corso...' });
        return;
      }

      const { uri } = await Print.printToFileAsync({ html: htmlTemplate });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Toast.show({ type: 'success', text1: 'PDF Generato', text2: 'Salvato nella cache interna.' });
      }

    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Errore', text2: 'Impossibile generare il PDF.' });
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topActions: {
      flexDirection: isTabletOrWeb ? 'row' : 'column',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 4,
      gap: 12,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
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
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    saveButton: {
      backgroundColor: colors.secondaryLight,
      borderColor: colors.secondary,
    },
    pdfButton: {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      borderColor: colors.border,
    },
    actionButtonText: {
      fontWeight: '700',
      fontSize: 15,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: isTabletOrWeb ? 40 : 24,
      paddingBottom: 80,
      maxWidth: 900,
      alignSelf: 'center',
      width: '100%',
    }
  });

  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 17,
      lineHeight: 28,
      color: colors.textMain,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    heading1: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.primary,
      marginTop: 28,
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 24,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 8,
    },
    heading3: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.secondary,
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
    ordered_list: {
      marginBottom: 16,
    },
    strong: {
      fontWeight: '800',
      color: theme === 'dark' ? '#ffffff' : '#000000',
    },
    em: {
      fontStyle: 'italic',
      color: colors.textLight,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 12,
      marginLeft: 0,
      marginVertical: 12,
      backgroundColor: colors.primaryLight,
      paddingVertical: 8,
      paddingRight: 8,
      borderRadius: 4,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 24,
    }
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Risultato Riassunto' }} />
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.topActions}>
          <View style={dynamicStyles.actionRow}>
            <TouchableOpacity style={[dynamicStyles.actionButton, dynamicStyles.copyButton]} onPress={handleCopy} activeOpacity={0.7}>
              <Copy size={20} color={colors.primary} />
              <Text style={[dynamicStyles.actionButtonText, { color: colors.primary }]}>Copia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[dynamicStyles.actionButton, dynamicStyles.saveButton]} onPress={handleSaveTXT} activeOpacity={0.7}>
              <Save size={20} color={colors.secondary} />
              <Text style={[dynamicStyles.actionButtonText, { color: colors.secondary }]}>TXT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[dynamicStyles.actionButton, dynamicStyles.pdfButton]} onPress={handleExportPDF} activeOpacity={0.7}>
              <FileDown size={20} color={colors.textMain} />
              <Text style={[dynamicStyles.actionButtonText, { color: colors.textMain }]}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={dynamicStyles.scrollContent}>
          <Markdown style={markdownStyles}>
            {summaryText}
          </Markdown>
        </ScrollView>
      </View>
    </>
  );
}
