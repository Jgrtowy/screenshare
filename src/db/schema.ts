import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    adminPanelAllowed: boolean("admin_panel_allowed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const roomsSchema = pgTable("rooms", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    name: text("name"),
    userId: text("user_id").notNull(),
    discordServerId: text("discord_server_id"),
});

export const jellyfinSettingsSchema = pgTable(
    "jellyfin_settings",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        enabled: boolean("enabled").default(false).notNull(),
        url: text("url"),
        apiKey: text("api_key"),
        username: text("username"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [unique("jellyfin_settings_user_id_unique").on(table.userId)],
);

export const roomViewersSchema = pgTable(
    "room_viewers",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        roomSlug: text("room_slug").notNull(),
        viewerKey: text("viewer_key").notNull(),
        name: text("name").notNull(),
        image: text("image"),
        isAuthenticated: boolean("is_authenticated").default(false).notNull(),
        lastSeenAt: timestamp("last_seen_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [unique("room_viewers_room_slug_viewer_key_unique").on(table.roomSlug, table.viewerKey), index("room_viewers_room_slug_last_seen_idx").on(table.roomSlug, table.lastSeenAt)],
);

export const streamKeysSchema = pgTable("stream_keys", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    key: text("key").notNull().unique(),
    userId: text("user_id").notNull(),
});

export const streamKeysRelations = relations(streamKeysSchema, ({ one }) => ({
    user: one(user, {
        fields: [streamKeysSchema.userId],
        references: [user.id],
    }),
}));

export const roomsRelations = relations(roomsSchema, ({ one }) => ({
    user: one(user, {
        fields: [roomsSchema.userId],
        references: [user.id],
    }),
}));

export const jellyfinSettingsRelations = relations(jellyfinSettingsSchema, ({ one }) => ({
    user: one(user, {
        fields: [jellyfinSettingsSchema.userId],
        references: [user.id],
    }),
}));
