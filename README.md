# Kenya Automatic Fare Collection System (AFCS)

## Project Overview

The Kenya Automatic Fare Collection System (AFCS) is a comprehensive platform designed to streamline and digitize fare collection for public transportation systems in Kenya. The system provides a centralized solution for managing users, SACCOs (Savings and Credit Cooperative Organizations), vehicles, routes, and transactions. It aims to enhance efficiency, transparency, and accountability in the public transport sector.

The platform is built with modern web technologies and offers role-based access for different types of users, including passengers, drivers, SACCO administrators, and system administrators.

---

## Features

### User Features
- **Dashboard**: View wallet balance, recent transactions, and frequent routes.
- **Wallet Management**: Top-up wallet, view transaction history, and manage payment methods.
- **Booking**: Book trips and view trip history.
- **Support**: Access help and support resources.

### Driver Features
- **Dashboard**: View assigned trips, vehicle details, and performance metrics.
- **Trip Management**: Update trip status and report issues with vehicles.
- **Profile Management**: Update personal details and view license information.

### SACCO Admin Features
- **Dashboard**: View SACCO statistics, including total drivers, vehicles, routes, and revenue.
- **Driver Management**: Add, update, and deactivate drivers.
- **Vehicle Management**: Register, update, and manage vehicles.
- **Route Management**: Manage routes and schedules.
- **Analytics**: Generate reports and view revenue trends.

### System Admin Features
- **Dashboard**: View system-wide statistics, including total users, SACCOs, vehicles, and revenue.
- **User Management**: Manage all users in the system.
- **SACCO Management**: Register, update, and manage SACCOs.
- **Analytics**: View system-wide analytics and trends.

---

## Technologies Used

### Frontend
- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool for modern web applications.
- **TypeScript**: A strongly typed programming language that builds on JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **ShadCN-UI**: A collection of accessible and customizable UI components.

### Backend
- **Node.js**: A JavaScript runtime for building scalable server-side applications.
- **Express**: A web application framework for Node.js.
- **MySQL**: A relational database management system for storing data.
- **bcrypt**: For password hashing and security.
- **JWT (JSON Web Tokens)**: For secure user authentication and authorization.

### Other Tools
- **Axios**: For making HTTP requests.
- **React Query**: For managing server state in React applications.
- **Radix UI**: For accessible and customizable UI primitives.
- **Lucide Icons**: For modern and customizable icons.

---

## Project Structure

### Frontend
- **Components**: Reusable UI components such as buttons, modals, tables, and forms.
- **Pages**: Role-specific pages for users, drivers, SACCO admins, and system admins.
- **Services**: API service files for interacting with the backend.
- **Contexts**: Context providers for managing global state, such as authentication.

### Backend
- **Controllers**: Handle business logic for various features (e.g., user management, SACCO management).
- **Routes**: Define API endpoints for different modules.
- **Middleware**: Handle authentication, error handling, and request validation.
- **Database**: MySQL database with tables for users, SACCOs, vehicles, routes, trips, and transactions.

---

## Installation and Setup

### Prerequisites
- **Node.js**: Install [Node.js](https://nodejs.org/) (v16 or later).
- **MySQL**: Install and configure MySQL.
- **npm**: Ensure npm is installed (comes with Node.js).

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/maxyn1/afcs.git
   cd afcs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the `backend` directory.
   - Add the following variables:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_NAME=afcs
     JWT_SECRET=yourjwtsecret
     ```

4. Initialize the database:
   ```bash
   cd backend
   node server.js
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000/api`

---

## Deployment

To deploy the project, you can use platforms like [Netlify](https://www.netlify.com/) for the frontend and [Heroku](https://www.heroku.com/) or [AWS](https://aws.amazon.com/) for the backend. Ensure the environment variables are correctly configured in the deployment environment.

---

## Future Enhancements

- **Real-Time Notifications**: Implement WebSocket or Firebase for real-time updates.
- **Mobile App**: Develop a mobile application for passengers and drivers.
- **Advanced Analytics**: Add more detailed analytics and reporting features.
- **Multi-Language Support**: Provide support for multiple languages.
- **Custom Domains**: Allow SACCOs to use custom domains for their dashboards.

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request with a detailed description of your changes.

---

## License

This project is licensed under the [ISC License](LICENSE).

---

## Contact

For any inquiries or support, please contact:
- **Email**: support@afcs.co.ke
- **GitHub Issues**: [GitHub Issues](https://github.com/maxyn1/afcs/issues)
