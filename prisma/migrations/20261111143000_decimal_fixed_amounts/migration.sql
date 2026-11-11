-- Preserve existing values while moving mixed percentage/fixed fields off binary floats.
ALTER TABLE "commission_rules"
  ALTER COLUMN "value" TYPE DECIMAL(18, 4)
  USING "value"::DECIMAL(18, 4);

ALTER TABLE "coupons"
  ALTER COLUMN "discount_value" TYPE DECIMAL(18, 4)
  USING "discount_value"::DECIMAL(18, 4);
