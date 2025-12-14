
# reColeta ♻️

**reColeta** é uma plataforma web progressiva (PWA) focada em gestão de resíduos, coleta seletiva inteligente e engajamento comunitário. A aplicação conecta moradores a administradores (condomínios, empresas ou associações), facilitando o descarte correto, otimizando rotas logísticas com Inteligência Artificial e incentivando hábitos sustentáveis através de gamificação.

---

## 🚀 Tecnologias Utilizadas

O projeto foi construído utilizando uma stack moderna e performática:

*   **Frontend:** React 19 (TypeScript)
*   **Estilização:** Tailwind CSS
*   **Inteligência Artificial:** Google Gemini API (`@google/genai`)
    *   *Modelos:* gemini-2.5-flash
*   **Mapas:** Leaflet / React-Leaflet
*   **Gráficos:** Recharts
*   **Ícones:** Lucide React
*   **Persistência de Dados:** LocalStorage (Simulação de Backend/API para MVP)

---

## ✨ Funcionalidades Principais

A plataforma divide as funcionalidades com base no papel do usuário (`Morador` ou `Organização`).

### 👤 Para Moradores (Residentes)
*   **Solicitação de Coleta:** Agendamento de retirada de resíduos (Recicláveis, Eletrônicos, Móveis, etc) com upload de fotos.
*   **Gamificação:** Ganhe XP ao completar desafios ecológicos, suba no ranking regional e troque pontos por recompensas na loja virtual.
*   **Comunidade:** Feed de notícias local para interagir com vizinhos, ver alertas e participar de projetos (ex: hortas comunitárias).
*   **EcoBot (IA):** Chatbot flutuante para tirar dúvidas sobre reciclagem e receber dicas sustentáveis.
*   **Consulta de Horários:** Visualização clara dos dias e horários de coleta seletiva na região.

### 🏢 Para Organizações (Síndicos/Gestores)
*   **Gestão de Solicitações:** Painel para aprovar, gerenciar e marcar coletas como realizadas.
*   **Otimização de Rotas (IA):** O sistema utiliza IA para gerar a rota mais eficiente para os pontos de coleta ativos, economizando tempo e combustível.
*   **Gestão de Gamificação:** Auditoria de provas enviadas pelos moradores e aprovação de resgate de prêmios.
*   **Alertas Oficiais:** Envio de comunicados importantes (push notifications simuladas) para os moradores da região.
*   **Dashboard de Impacto:** Métricas visuais sobre volume reciclado, economia gerada e engajamento.

---

## 📂 Estrutura de Pastas

```
/
├── components/           # Componentes da Interface (UI)
│   ├── AlertsPanel.tsx       # Painel de alertas e comunicados
│   ├── App.tsx               # Componente Raiz e Roteamento
│   ├── AuthPage.tsx          # Login e Cadastro (Dual Role)
│   ├── CommunityHub.tsx      # Feed social e Projetos
│   ├── EcoBot.tsx            # Interface de Chat Principal
│   ├── FloatingEcoBot.tsx    # Chatbot flutuante (Dicas)
│   ├── LandingPage.tsx       # Página de apresentação
│   ├── ProfilePage.tsx       # Edição de perfil
│   ├── RecyclingTips.tsx     # Guia educativo
│   ├── RequestCollection.tsx # Fluxo de solicitação de coleta
│   ├── ScheduleManager.tsx   # Gestão de horários
│   └── Sidebar.tsx           # Navegação lateral
│
├── services/             # Lógica de Negócios e "Backend" simulado
│   ├── alertService.ts       # CRUD de Alertas
│   ├── authService.ts        # Autenticação e Sessão
│   ├── communityService.ts   # Posts e Projetos
│   ├── geminiService.ts      # Integração com Google AI
│   ├── locationService.ts    # Integração ViaCEP
│   ├── requestService.ts     # CRUD de Solicitações
│   └── validationService.ts  # Validadores (CPF, CNPJ, etc)
│
├── types.ts              # Definições de Tipos TypeScript
├── index.tsx             # Ponto de entrada React
├── index.html            # Entry point HTML
└── metadata.json         # Configurações e permissões
```

---

## 🤖 Integração com Inteligência Artificial

O **reColeta** utiliza a API do Google Gemini para potencializar a experiência:

1.  **EcoBot:** Um assistente virtual capaz de responder perguntas em linguagem natural sobre sustentabilidade e uso do app, limpando formatações complexas para uma experiência de chat fluida.
2.  **Dica do Dia:** Geração diária de conteúdo motivacional ou educativo sobre meio ambiente.

---

## 🛠️ Como Executar

1.  Certifique-se de ter um ambiente React configurado.
2.  Instale as dependências listadas no `importmap` ou `package.json` (React, Leaflet, Lucide, Google GenAI SDK).
3.  Configure a variável de ambiente `API_KEY` com sua chave da Google Gemini API.
4.  Execute a aplicação.

> **Nota:** Este projeto utiliza `LocalStorage` para persistência de dados. Para testar diferentes perfis (Morador vs Organização), recomenda-se usar janelas anônimas ou fazer logout/login, pois os dados são salvos no navegador.

