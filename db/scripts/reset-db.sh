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

# Check if seed directory exists and apply seed files
SEED_DIR="$(dirname "$0")/../seed"
if [ -d "$SEED_DIR" ]; then
    echo -e "${YELLOW}🌱 Seeding additional data...${NC}"
    
    # Seed users first
    if [ -f "$SEED_DIR/users.sql" ]; then
        echo -e "${YELLOW}   👤 Seeding users...${NC}"
        docker exec -i $CONTAINER_NAME psql -U postgres -d journal < "$SEED_DIR/users.sql"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Error seeding users${NC}"
            exit 1
        fi
    fi
    
    # Seed journal entries
    if [ -f "$SEED_DIR/journal-entries.js" ]; then
        echo -e "${YELLOW}   📖 Seeding journal entries...${NC}"
        node $SEED_DIR/journal-entries.js | docker exec -i $CONTAINER_NAME psql -U postgres -d journal
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Error seeding journal entries${NC}"
            exit 1
        fi
    fi
    
    # Seed nodes
    if [ -f "$SEED_DIR/nodes.sql" ]; then
        echo -e "${YELLOW}   🧠 Seeding nodes...${NC}"
        docker exec -i $CONTAINER_NAME psql -U postgres -d journal < "$SEED_DIR/nodes.sql"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Error seeding nodes${NC}"
            exit 1
        fi
    fi
    
    # Seed edges
    if [ -f "$SEED_DIR/edges.sql" ]; then
        echo -e "${YELLOW}   🔗 Seeding edges...${NC}"
        docker exec -i $CONTAINER_NAME psql -U postgres -d journal < "$SEED_DIR/edges.sql"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Error seeding edges${NC}"
            exit 1
        fi
    fi
    
    # Seed node-entry mappings
    if [ -f "$SEED_DIR/node-entry-map.sql" ]; then
        echo -e "${YELLOW}   📊 Seeding node-entry mappings...${NC}"
        docker exec -i $CONTAINER_NAME psql -U postgres -d journal < "$SEED_DIR/node-entry-map.sql"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Error seeding node-entry mappings${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  No seed directory found, skipping additional data${NC}"
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