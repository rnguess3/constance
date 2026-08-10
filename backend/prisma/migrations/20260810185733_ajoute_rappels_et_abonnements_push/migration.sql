-- CreateTable
CREATE TABLE "preferences_rappel" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rappel_matin_actif" BOOLEAN NOT NULL DEFAULT false,
    "heure_matin" TEXT NOT NULL DEFAULT '08:00',
    "rappel_soir_actif" BOOLEAN NOT NULL DEFAULT false,
    "heure_soir" TEXT NOT NULL DEFAULT '20:00',
    "fuseau_horaire" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "derniere_date_envoi_matin" TEXT,
    "derniere_date_envoi_soir" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferences_rappel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements_push" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "cle_p256dh" TEXT NOT NULL,
    "cle_auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_push_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "preferences_rappel_user_id_key" ON "preferences_rappel"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_push_endpoint_key" ON "abonnements_push"("endpoint");

-- CreateIndex
CREATE INDEX "abonnements_push_user_id_idx" ON "abonnements_push"("user_id");
