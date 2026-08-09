-- CreateEnum
CREATE TYPE "TypeMesure" AS ENUM ('tension', 'glycemie');

-- CreateTable
CREATE TABLE "mesures" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TypeMesure" NOT NULL,
    "valeur_1" INTEGER NOT NULL,
    "valeur_2" INTEGER,
    "pouls" INTEGER,
    "contexte" TEXT NOT NULL,
    "note" TEXT,
    "date_heure" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mesures_user_id_idx" ON "mesures"("user_id");

-- CreateIndex
CREATE INDEX "mesures_user_id_type_date_heure_idx" ON "mesures"("user_id", "type", "date_heure");
