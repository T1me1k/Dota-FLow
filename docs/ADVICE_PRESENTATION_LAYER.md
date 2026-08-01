# Advice Presentation Layer

The independent presentation module maps reason codes to deterministic Russian and English player wording for `BEGINNER`, `STANDARD`, and `EXPERT`. Unknown codes use a generic uncertainty statement. Deduplication and validation prevent undefined values, untranslated internal enums, empty instructions, and oversized expert/beginner output. Decision engines never consume rendered text.
