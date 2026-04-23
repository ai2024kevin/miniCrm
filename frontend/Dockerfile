FROM node:22-bookworm-slim AS deps
WORKDIR /app/frontend
COPY frontend/package.json ./package.json
RUN npm install

FROM node:22-bookworm-slim AS build
WORKDIR /app/frontend
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY --from=deps /app/frontend/node_modules ./node_modules
COPY frontend ./
COPY JSON_design_systems ../JSON_design_systems
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/frontend/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
