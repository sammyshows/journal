#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Docker container name (adjust if different)
CONTAINER_NAME="journal_db_dev"

echo -e "${YELLOW}🔄 Resetting Journal AI Database...${NC}"

# Check if Docker container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}❌ Error: Docker container '$CONTAINER_NAME' is not running.${NC}"
    echo -e "${YELLOW}💡 Start it with: docker-compose up -d${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Dropping existing database...${NC}"
docker exec -i $CONTAINER_NAME psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS journal;"

echo -e "${YELLOW}🏗️  Creating fresh database...${NC}"
docker exec -i $CONTAINER_NAME psql -U postgres -d postgres -c "CREATE DATABASE journal;"

echo -e "${YELLOW}📋 Applying schema...${NC}"
docker exec -i $CONTAINER_NAME psql -U postgres -d journal < "$(dirname "$0")/../schema.sql"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error applying schema${NC}"
    exit 1
fi

# Check if seed file exists and apply it
if [ -f "$(dirname "$0")/../seed.sql" ]; then
    echo -e "${YELLOW}🌱 Seeding test data...${NC}"
    docker exec -i $CONTAINER_NAME psql -U postgres -d journal < "$(dirname "$0")/../seed.sql"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error seeding data${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No seed.sql found, skipping test data${NC}"
fi

echo -e "${GREEN}✅ Database reset complete!${NC}"
echo -e "${GREEN}📊 Connection info:${NC}"
echo -e "   Host: localhost:5432"
echo -e "   Database: journal"
echo -e "   Username: postgres"
echo -e "   Password: postgres"

# Optional: Show table count to verify
echo -e "${YELLOW}📈 Verifying setup...${NC}"
TABLE_COUNT=$(docker exec -i $CONTAINER_NAME psql -U postgres -d journal -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo -e "${GREEN}   Created $TABLE_COUNT tables${NC}"

if [ -f "$(dirname "$0")/../seed.sql" ]; then
    ENTRY_COUNT=$(docker exec -i $CONTAINER_NAME psql -U postgres -d journal -t -c "SELECT COUNT(*) FROM journal_entries;")
    echo -e "${GREEN}   Seeded $ENTRY_COUNT journal entries${NC}"
fi