# **App Name**: LexFlow ERP

## Core Features:

- Lead Management & Triaging: Manage potential clients through a Kanban pipeline (NOVO -> ATENDIMENTO -> CONTRATUAL -> BUROCRACIA -> DISTRIBUIÇÃO), utilize dynamic questionnaires, and automate conversion of leads to active cases in Firestore.
- Case Management & Google Drive Integration: Organize legal cases and their dossiers in Firestore, automatically create standardized Google Drive folders (Petições, Provas, Decisões) within client directories, qualify multiple defendants, and visualize case timelines with semantic icons.
- Advanced Calendar & Notification System: Synchronize hearings and appointments bidirectionally with Google Calendar, manage hearing data in Firestore, generate WhatsApp notifications with coded messages, and streamline post-act follow-ups.
- AI-Powered Judicial Deadline Tracking: Automate calculation of judicial deadlines (e.g., CPC - D+1) in Firestore, use an AI tool for parsing raw DJE publications to extract critical dates and types, and integrate with Google Tasks for lawyer caseloads.
- Financial & Honorarium Management: Manage honorarium division (e.g., 70% Escritório / 30% Advogado) and payouts in Firestore, track staff credits ('Retidos' vs. 'Disponível'), and generate professional receipts.
- AI-Assisted Document Drafting: Leverage a generative AI tool to automate the drafting of legal document templates and assist in content creation using Google Docs.
- Secure User Authentication & Access Control: Implement robust user authentication with NextAuth and Firebase Authentication, supporting role-based access control (admin, lawyer, financial, assistant) with customized permissions for data and features managed in Firestore.

## Style Guidelines:

- Background color: Deep Navy (#020617), providing a professional and dark aesthetic.
- Primary color: Vibrant Gold (#F5D030), emphasizing key elements and representing value.
- Accent color (Success/Completion): Muted Emerald Green (#438F56).
- Accent color (Alert/Highlight): Muted Rose (#BD4073).
- Accent color (Informational/Interactive): Corporate Blue (#4D8BB1).
- Headline font: 'Playfair' (serif) for an elegant, high-end feel.
- Body and data font: 'PT Sans' (humanist sans-serif) for clarity and readability in detailed content.
- Professional and semantic icons should be used to represent legal actions, statuses, and modules.
- Overall design characterized by rounded borders and subtle glassmorphism effects to enhance visual depth and modern feel.