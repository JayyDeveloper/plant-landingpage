-- Vibe Newsletter Platform Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    vibe_preferences JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_features JSONB DEFAULT '[]',
    role VARCHAR(50) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletters table
CREATE TABLE newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    subject_line VARCHAR(500),
    preview_text VARCHAR(255),
    vibe JSONB DEFAULT '{}',
    content JSONB DEFAULT '[]',
    layout JSONB DEFAULT '{}',
    template_id VARCHAR(255),
    schedule JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    parent_version_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    CONSTRAINT fk_newsletter_parent FOREIGN KEY (parent_version_id) REFERENCES newsletters(id) ON DELETE SET NULL
);

-- Subscribers table
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    segments JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    engagement_score FLOAT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    last_engaged_at TIMESTAMP,
    UNIQUE(user_id, email)
);

-- Newsletter sends tracking
CREATE TABLE newsletter_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    first_click_at TIMESTAMP,
    bounced BOOLEAN DEFAULT false,
    bounce_reason TEXT,
    unsubscribed BOOLEAN DEFAULT false,
    unsubscribed_at TIMESTAMP
);

-- Analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_send_id UUID REFERENCES newsletter_sends(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates (cached in MongoDB, key info in PostgreSQL)
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vibe_tags JSONB DEFAULT '[]',
    preview_url TEXT,
    popularity_score INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration
CREATE TABLE collaboration_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(newsletter_id, user_id)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    block_path VARCHAR(255),
    position JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plugins
CREATE TABLE plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    author VARCHAR(255),
    repository_url TEXT,
    manifest JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    install_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User plugin installations
CREATE TABLE user_plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, plugin_id)
);

-- Scheduled jobs
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL,
    job_data JSONB NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_newsletters_user_id ON newsletters(user_id);
CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletters_created_at ON newsletters(created_at DESC);

CREATE INDEX idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_status ON subscribers(status);

CREATE INDEX idx_newsletter_sends_newsletter_id ON newsletter_sends(newsletter_id);
CREATE INDEX idx_newsletter_sends_subscriber_id ON newsletter_sends(subscriber_id);
CREATE INDEX idx_newsletter_sends_sent_at ON newsletter_sends(sent_at);

CREATE INDEX idx_analytics_events_newsletter_send_id ON analytics_events(newsletter_send_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX idx_templates_vibe_tags ON templates USING GIN(vibe_tags);
CREATE INDEX idx_templates_popularity ON templates(popularity_score DESC);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_collaboration_newsletter_id ON collaboration_permissions(newsletter_id);
CREATE INDEX idx_collaboration_user_id ON collaboration_permissions(user_id);

CREATE INDEX idx_comments_newsletter_id ON comments(newsletter_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

CREATE INDEX idx_scheduled_jobs_scheduled_for ON scheduled_jobs(scheduled_for);
CREATE INDEX idx_scheduled_jobs_status ON scheduled_jobs(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON newsletters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics
CREATE VIEW newsletter_analytics AS
SELECT
    n.id as newsletter_id,
    n.title,
    n.user_id,
    COUNT(DISTINCT ns.id) as total_sends,
    COUNT(DISTINCT CASE WHEN ns.delivered_at IS NOT NULL THEN ns.id END) as total_delivered,
    COUNT(DISTINCT CASE WHEN ns.opened_at IS NOT NULL THEN ns.id END) as total_opens,
    COUNT(DISTINCT CASE WHEN ns.first_click_at IS NOT NULL THEN ns.id END) as total_clicks,
    COUNT(DISTINCT CASE WHEN ns.bounced THEN ns.id END) as total_bounces,
    COUNT(DISTINCT CASE WHEN ns.unsubscribed THEN ns.id END) as total_unsubscribes,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN ns.opened_at IS NOT NULL THEN ns.id END) /
        NULLIF(COUNT(DISTINCT CASE WHEN ns.delivered_at IS NOT NULL THEN ns.id END), 0),
        2
    ) as open_rate,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN ns.first_click_at IS NOT NULL THEN ns.id END) /
        NULLIF(COUNT(DISTINCT CASE WHEN ns.delivered_at IS NOT NULL THEN ns.id END), 0),
        2
    ) as click_rate
FROM newsletters n
LEFT JOIN newsletter_sends ns ON n.id = ns.newsletter_id
WHERE n.status = 'sent'
GROUP BY n.id, n.title, n.user_id;

-- Sample data for testing (optional)
-- INSERT INTO users (email, password_hash, name, subscription_plan) VALUES
--     ('demo@vibenewsletter.com', '$2a$10$...', 'Demo User', 'pro');
