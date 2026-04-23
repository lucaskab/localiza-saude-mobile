# Appointment Details Screen

Tela de detalhes de um agendamento para customers, incluindo informações do profissional, dados do appointment, mensagens e anexos.

## 📍 Rota

```
/appointment/[id]
```

**Exemplo:** `/appointment/123e4567-e89b-12d3-a456-426614174000`

## 🎯 Funcionalidades

### ✅ Implementadas

1. **Informações do Appointment**
   - Foto e nome do profissional de saúde
   - Especialidade
   - Tipo de procedimento
   - Data, hora e duração
   - Localização/contato

2. **Provider Notes** (apenas para appointments completados)
   - Notas médicas do profissional
   - Resultados de exames
   - Prescrições

3. **Sistema de Mensagens**
   - Chat entre paciente e profissional
   - Visualização de mensagens anteriores
   - Envio de novas mensagens
   - Diferenciação visual entre mensagens do paciente e profissional

4. **Anexos de Arquivos**
   - Visualização de arquivos anexados
   - Diferentes ícones para tipos de arquivo (PDF, imagens, planilhas)
   - Botão de download
   - Preview de arquivos selecionados antes de enviar

5. **Estados de Loading e Error**
   - Loading state com ActivityIndicator
   - Error state com botão de voltar
   - Tratamento quando appointment não é encontrado

### 🚧 Pendentes (Backend)

- [ ] Integração real com sistema de mensagens
- [ ] Upload de arquivos para servidor
- [ ] Download de arquivos anexados
- [ ] Notificações em tempo real de novas mensagens
- [ ] Histórico completo de mensagens do backend

## 🚀 Navegação

A tela pode ser acessada de:

1. **Lista de Appointments** - Clicando em qualquer card de appointment
   ```tsx
   router.push(`/appointment/${appointment.id}`)
   ```

2. **Volta** - Botão de voltar no header
   ```tsx
   router.back()
   ```

## 📊 Estrutura de Dados

### Appointment

```typescript
interface Appointment {
  id: string;
  customerId: string;
  customer: Customer;
  healthcareProviderId: string;
  healthcareProvider: HealthcareProvider;
  scheduledAt: string;
  status: AppointmentStatus;
  totalDurationMinutes: number;
  totalPriceCents: number;
  notes: string | null;
  appointmentProcedures: AppointmentProcedure[];
}
```

### Message (Mock)

```typescript
interface Message {
  id: string;
  sender: "provider" | "patient";
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: AttachedFile[];
}
```

### AttachedFile (Mock)

```typescript
interface AttachedFile {
  id: string;
  name: string;
  type: "image" | "pdf" | "excel" | "other";
  uri: string;
  uploadedBy: "provider" | "patient";
  uploadedAt: string;
}
```

## 🎨 Design System

### Cores Utilizadas

- `theme.colors.primary` - Botão de enviar, ícones de detalhes
- `theme.colors.secondary` - Cards de informação, mensagens do provider
- `theme.colors.surfacePrimary` - Header, input container
- `theme.colors.background` - Background principal
- `theme.colors.foreground` - Textos principais
- `theme.colors.mutedForeground` - Textos secundários

### Componentes Reutilizados

- ✅ `Badge` - Status e tipo de procedimento
- ✅ `Button` - Ações e navegação
- ✅ `Textarea` - Input de mensagem
- ✅ `SafeAreaView` - Layout responsivo
- ✅ Lucide Icons - Todos os ícones

### Espaçamento

- Sections: `theme.gap(3)` padding
- Cards: `theme.gap(3)` padding interno
- Messages: `theme.gap(3)` spacing entre mensagens
- Input area: `theme.gap(2)` padding

### Bordas

- Cards: `theme.radius.xl` (12px)
- Buttons: `theme.radius.lg` (8px)
- Message bubbles: `theme.radius.xl`
- File chips: `theme.radius.lg`

## 📝 Código Principal

### Hook de Dados

```tsx
const { data: appointmentData, isLoading, error } = useAppointment(
  id || "",
  !!id
);
```

### Formatação de Data

```tsx
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { date: formattedDate, time: formattedTime };
};
```

### Sistema de Mensagens

```tsx
const handleSendMessage = () => {
  if (!newMessage.trim() && selectedFiles.length === 0) {
    Alert.alert("Error", "Please enter a message or attach a file");
    return;
  }

  const message: Message = {
    id: `m${Date.now()}`,
    sender: "patient",
    senderName: "You",
    content: newMessage,
    timestamp: new Date().toLocaleString(),
    attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
  };

  setMessages([...messages, message]);
  setNewMessage("");
  setSelectedFiles([]);
};
```

## 🔄 Estados

### Loading State

```tsx
if (isLoading) {
  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading appointment...</Text>
      </View>
    </SafeAreaView>
  );
}
```

### Error State

```tsx
if (error || !appointment) {
  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Appointment not found</Text>
        <Button onPress={() => router.back()}>
          Back to Appointments
        </Button>
      </View>
    </SafeAreaView>
  );
}
```

## 🎯 Próximos Passos

### Backend Integration

1. **Mensagens**
   ```tsx
   // Hook para mensagens
   const { data: messages } = useMessages(appointmentId);
   
   // Mutation para enviar mensagem
   const sendMessageMutation = useSendMessage();
   ```

2. **Upload de Arquivos**
   ```tsx
   // Instalar expo-document-picker
   npm install expo-document-picker
   
   // Implementar upload
   const uploadFileMutation = useUploadFile();
   ```

3. **WebSocket para Real-time**
   ```tsx
   // Conectar ao WebSocket
   useEffect(() => {
     const ws = new WebSocket(`ws://.../${appointmentId}`);
     ws.onmessage = (event) => {
       const newMessage = JSON.parse(event.data);
       setMessages(prev => [...prev, newMessage]);
     };
   }, [appointmentId]);
   ```

### Melhorias UI/UX

1. **Preview de Imagens**
   - Lightbox para visualizar imagens
   - Zoom e pan

2. **Indicador de Digitação**
   - Mostrar quando o profissional está digitando

3. **Status de Entrega**
   - Indicadores de enviado/lido nas mensagens

4. **Notificações Push**
   - Notificar quando houver nova mensagem

5. **Audio Messages**
   - Permitir envio de mensagens de áudio

6. **Video Call**
   - Integração com sistema de chamada de vídeo

## 📱 Responsividade

A tela é totalmente responsiva e adapta-se a diferentes tamanhos de tela:

- Messages limitadas a 80% da largura
- ScrollView com contentContainerStyle adequado
- Input fixo na parte inferior
- SafeAreaView para respeitar notch/status bar

## 🐛 Troubleshooting

### Mensagem não aparece
- Verificar se `appointmentId` está correto
- Checar console para erros de API
- Validar permissões de autenticação

### Arquivos não anexam
- Implementar `expo-document-picker` primeiro
- Verificar permissões de storage no device

### Layout quebrado
- Limpar cache: `npm start -- --clear`
- Verificar se unistyles está configurado corretamente

## 📚 Referências

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Unistyles](https://reactnativeunistyles.vercel.app/)