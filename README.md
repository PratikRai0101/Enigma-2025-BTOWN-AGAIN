# Enigma-2025-BTOWN-AGAIN
To run the project locally after cloning it from GitHub, follow these steps:

Prerequisites
Node.js: Ensure you have Node.js installed. You can download it from nodejs.org.

Git: Ensure you have Git installed. You can download it from git-scm.com.

Steps to Run the Project Locally
Clone the Repository: Open a terminal and run the following command to clone the repository:

git clone https://github.com/your-username/your-repository.git

Replace your-username and your-repository with your GitHub username and repository name.

Navigate to the Project Directory: Change to the project directory:
cd your-repository


Install Dependencies: Run the following command to install the project dependencies:
npm install

Set Up Environment Variables: Create a .env.local file in the root of your project directory and add any necessary environment variables. For example:
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
Replace the values with your actual Supabase URL and anonymous key.

Run the Development Server: Start the development server by running:
npm run dev

Open the Application: Open your browser and navigate to http://localhost:3000 to see your application running locally.

Example .env.local File
Here is an example of what your .env.local file might look like:

Summary
Clone the repository using git clone.
Navigate to the project directory using cd.
Install dependencies using npm install.
Set up environment variables in a .env.local file.
Run the development server using npm run dev.
Open the application in your browser at http://localhost:3000.
By following these steps, anyone can run the project locally after cloning it from GitHub.
