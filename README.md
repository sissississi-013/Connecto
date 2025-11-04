# CONNECTO

An AI-powered networking agent that automates the process of finding, contacting, and managing professional connections.

## Demo Link

**Live Demo:** [https://connecto.vercel.app](https://connecto.vercel.app)
**GitHub:** [https://github.com/sissississi-013/Connecto](https://github.com/sissississi-013/Connecto)

## Overview

CONNECTO is a sophisticated web application that leverages cutting-edge AI and data technologies to revolutionize professional networking. The platform automates connection discovery, generates personalized outreach messages, and maintains a smart CRM system—all powered by four key sponsor technologies.

## Sponsor Technologies

### 🎙️ **Telnyx** - Voice AI & Communication
- **Implementation:** Conversational onboarding interview via voice
- **Features:**
  - Real-time voice transcription for user requests
  - Voice-enabled connection requests
  - Interactive voice agent represented by an animated sphere
- **Location in code:** `lib/telnyx/client.ts`, `components/voice/VoiceAgent.tsx`

### 💾 **MemVerge** - Persistent Memory & CRM
- **Implementation:** User profile storage and connection relationship management
- **Features:**
  - Stores user profiles, resumes, and interview answers
  - Maintains connection history and conversation threads
  - Tag-based organization for bulk operations
  - Powers the entire CRM functionality
- **Location in code:** `lib/memverge/client.ts`, all API routes accessing user data

### 🔍 **ApertureData** - Profile Database & Complex Queries
- **Implementation:** Connection profile storage with advanced search capabilities
- **Features:**
  - Stores scraped LinkedIn profile data
  - Enables complex multi-dimensional queries (industry, role, location, education)
  - Unified search across profile attributes
  - Powers the connection discovery engine
- **Location in code:** `lib/aperturedata/client.ts`, `app/api/connections/search/route.ts`

### 📊 **Comet ML** - LLM Operations Monitoring
- **Implementation:** Tracks and optimizes AI-generated outreach messages
- **Features:**
  - Logs every generated message with personalization parameters
  - Tracks reply rates and response times
  - A/B testing different message tones
  - Performance dashboard showing outreach effectiveness
- **Location in code:** `lib/comet/client.ts`, `app/api/outreach/generate/route.ts`, CRM dashboard

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS with naval blue theme
- **Authentication:** NextAuth.js with Google OAuth
- **AI/LLM:** OpenAI GPT-4 for message generation and insights
- **Deployment:** Vercel

## Features

### 1. **Voice-Powered Onboarding**
- Google OAuth sign-in
- Conversational voice interview powered by Telnyx
- Resume upload (PDF) with automatic parsing
- Data stored persistently in MemVerge

### 2. **Intelligent Connection Discovery**
- Voice or text-based requests (e.g., "Connect me with gametech VCs")
- AI analyzes request and extracts search criteria
- LinkedIn profile scraping (mock in demo)
- Profiles stored in ApertureData with complex query support

### 3. **AI-Generated Insights**
- Each potential connection gets an AI-generated review
- Contextual insights based on user's career goals
- Powered by OpenAI GPT-4

### 4. **Personalized Outreach**
- Select multiple connections for bulk outreach
- AI generates personalized emails for each contact
- Pulls context from both user profile (MemVerge) and target profile (ApertureData)
- Tone customization (professional, student-like, casual)
- Calendar link integration
- Every message tracked in Comet ML

### 5. **Smart CRM**
- All connections automatically saved to MemVerge
- Tag-based organization (#School, #GettingIntoYC, etc.)
- Conversation history tracking
- Bulk operations (e.g., "Send update to everyone in #GettingIntoYC")
- Performance metrics dashboard powered by Comet ML

## Project Structure

```
CONNECTO/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # NextAuth configuration
│   │   ├── onboarding/        # Onboarding completion
│   │   ├── connections/       # Connection search & management
│   │   ├── outreach/          # Message generation
│   │   ├── crm/               # CRM operations
│   │   └── comet/             # Comet ML metrics
│   ├── onboarding/            # Onboarding page
│   ├── dashboard/             # Main chat interface
│   ├── connections/           # Connection results
│   ├── crm/                   # CRM management
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/
│   ├── voice/                 # Voice agent components
│   ├── onboarding/            # Onboarding components
│   └── SessionProvider.tsx    # Auth session provider
├── lib/
│   ├── telnyx/               # Telnyx integration
│   ├── memverge/             # MemVerge integration
│   ├── aperturedata/         # ApertureData integration
│   ├── comet/                # Comet ML integration
│   ├── ai/                   # LLM utilities
│   └── auth.ts               # NextAuth configuration
├── types/                     # TypeScript type definitions
└── public/                    # Static assets
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Google OAuth credentials
- API keys for Telnyx, MemVerge, ApertureData, Comet ML, and OpenAI

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sissississi-013/Connecto.git
   cd Connecto
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` with your API keys:
   ```env
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-here

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Telnyx
   TELNYX_API_KEY=your-telnyx-api-key
   TELNYX_CONNECTION_ID=your-telnyx-connection-id
   NEXT_PUBLIC_TELNYX_API_KEY=your-public-key

   # MemVerge
   MEMVERGE_API_URL=your-memverge-url
   MEMVERGE_API_KEY=your-memverge-key

   # ApertureData
   APERTUREDATA_HOST=your-host
   APERTUREDATA_PORT=55555
   APERTUREDATA_USERNAME=admin
   APERTUREDATA_PASSWORD=your-password

   # Comet ML
   COMET_API_KEY=your-comet-api-key
   COMET_PROJECT_NAME=connecto
   COMET_WORKSPACE=your-workspace

   # OpenAI
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

### Deployment to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Deploy!

## Demo Flow

1. **Landing Page:** Sign in with Google
2. **Onboarding:**
   - Upload resume (PDF)
   - Complete voice interview with Telnyx agent
3. **Dashboard:**
   - Type or speak: "Connect me with the hosts of this hackathon"
4. **Results:**
   - View AI-generated insights for each connection
   - Select connections to reach out to
5. **Outreach:**
   - Review personalized messages (tracked in Comet ML)
   - Send messages
6. **CRM:**
   - View all connections with tags
   - See Comet ML performance dashboard

## Key Sponsor Integration Points

| Sponsor | Purpose | Code Location | Demo Feature |
|---------|---------|---------------|--------------|
| **Telnyx** | Voice AI | `lib/telnyx/`, `components/voice/` | Onboarding interview, voice requests |
| **MemVerge** | Persistent Memory | `lib/memverge/` | User profiles, CRM storage |
| **ApertureData** | Profile DB & Search | `lib/aperturedata/` | Connection storage, complex queries |
| **Comet ML** | LLM Monitoring | `lib/comet/`, CRM dashboard | Message tracking, A/B testing |

## Future Enhancements

- Real LinkedIn API integration
- Automated follow-up scheduling
- Email sending via SMTP
- Advanced tagging and filtering
- Mobile app (React Native)
- Multi-language support

## License

MIT License - See LICENSE file for details

## Contact

Built by [Your Name] for [Hackathon Name]

- GitHub: [@sissississi-013](https://github.com/sissississi-013)
- Project: [https://github.com/sissississi-013/Connecto](https://github.com/sissississi-013/Connecto)
