# QueRegalo

Gift wishlist sharing app for groups. Create groups, share wishlists, and claim gifts without spoiling surprises.

## Features

- **Group Management** - Create and share groups with unique secure links
- **Wishlist** - Add gifts with name, price, and location details
- **Gift Claiming** - Lock gifts you plan to buy (keep surprises secret)
- **Cloud Storage** - All data persisted in MongoDB Atlas
- **Cross-Device** - Access from any device with the shared link
- **Mobile Responsive** - Fully optimized for all screen sizes
- **Data Validation** - Type-safe data with comprehensive validation

## Tech Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Backend**: Netlify Functions (Serverless)
- **Database**: MongoDB Atlas
- **Hosting**: Netlify

## Quick Start

### Setup

1. Clone and install:
```bash
git clone https://github.com/davidciria/queregalo.git
cd queregalo
npm install
```

2. Create `.env` with your MongoDB URI:
```bash
MONGODB_URI=your_mongodb_connection_string
```

3. Deploy to Netlify:
```bash
netlify deploy
```

### Local Development

Set `MONGODB_URI` environment variable and run:
```bash
netlify dev
```

App runs at `http://localhost:3000`

## API Endpoints

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups/:groupId` - Get group details

### Users
- `POST /api/groups/:groupId/users` - Create/select user
- `GET /api/groups/:groupId/users` - List group users

### Gifts
- `POST /api/groups/:groupId/users/:userId/gifts` - Add gift
- `GET /api/groups/:groupId/gifts` - Get all group gifts
- `PUT /api/gifts/:giftId/lock` - Claim gift
- `PUT /api/gifts/:giftId/unlock` - Release gift
- `DELETE /api/gifts/:giftId` - Remove gift

## Data Validation

- **Group Name**: 2-100 characters
- **User Name**: 2-100 characters
- **Gift Name**: 2-200 characters
- **Gift Price**: Integer 1-100000
- **Gift Location**: 2-500 characters

All validations are enforced on both client and server.

## Usage

### Owner
1. Create group → Share link
2. Add gifts with details
3. View who claimed which gift

### Participant
1. Open shared link
2. Select or create user
3. View friends' wishlists
4. Claim gifts to buy

## Project Structure

```
queregalo/
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── netlify/functions/
│   └── api.js
├── package.json
├── netlify.toml
└── README.md
```

## Security

- Secure group IDs (UUID + timestamp + random)
- No passwords required
- HTTPS enforced
- Atomic DB operations prevent race conditions
- Input validation on all endpoints

## License

MIT

## Support

Found a bug? Open an [issue on GitHub](https://github.com/davidciria/queregalo/issues)
