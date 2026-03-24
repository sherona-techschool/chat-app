# 1️⃣ Use official Node image
FROM node:18

# 2️⃣ Set working directory inside container
WORKDIR /app

# 3️⃣ Copy package.json and package-lock.json
COPY package*.json ./

# 4️⃣ Install dependencies
RUN npm install

# 5️⃣ Copy all files
COPY . .

# 6️⃣ Expose port (same as your backend port)
EXPOSE 3000

# 7️⃣ Start application
CMD ["npm", "start"]