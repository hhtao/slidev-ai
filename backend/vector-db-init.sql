-- 向量数据库初始化脚本
-- 需要在PostgreSQL中启用pgvector扩展

-- 1. 创建pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建向量存储表
CREATE TABLE IF NOT EXISTS vectors (
    id VARCHAR(255) PRIMARY KEY,
    knowledge_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建索引优化搜索性能
CREATE INDEX IF NOT EXISTS idx_vectors_knowledge_id ON vectors(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_vectors_embedding ON vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_vectors_metadata_user_id ON vectors USING GIN ((metadata->>'userId'));
CREATE INDEX IF NOT EXISTS idx_vectors_metadata_visibility ON vectors USING GIN ((metadata->>'visibility'));

-- 4. 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vectors_updated_at 
    BEFORE UPDATE ON vectors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 创建相似性搜索函数
CREATE OR REPLACE FUNCTION search_similar_vectors(
    query_embedding vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10,
    filter_user_id INTEGER DEFAULT NULL,
    filter_visibility TEXT DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR(255),
    knowledge_id INTEGER,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.knowledge_id,
        v.content,
        v.metadata,
        1 - (v.embedding <=> query_embedding) as similarity
    FROM vectors v
    WHERE 
        1 - (v.embedding <=> query_embedding) > similarity_threshold
        AND (filter_user_id IS NULL OR (v.metadata->>'userId')::INTEGER = filter_user_id)
        AND (filter_visibility IS NULL OR v.metadata->>'visibility' = filter_visibility)
    ORDER BY similarity DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建统计信息视图
CREATE OR REPLACE VIEW vector_stats AS
SELECT 
    COUNT(*) as total_vectors,
    COUNT(DISTINCT (metadata->>'userId')::INTEGER) as total_users,
    AVG(array_length(embedding, 1)) as average_vector_size,
    COUNT(*) FILTER (WHERE metadata->>'visibility' = 'public') as public_vectors,
    COUNT(*) FILTER (WHERE metadata->>'visibility' = 'private') as private_vectors
FROM vectors;