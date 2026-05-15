from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("animals", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="animal",
            name="country",
            field=models.CharField(
                db_index=True,
                default="FR",
                help_text="Code pays ISO 3166-1 alpha-2 utilisé par le moteur de règles sanitaires.",
                max_length=2,
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="main_usage",
            field=models.CharField(
                choices=[
                    ("leisure", "Loisir"),
                    ("boarding", "Pension"),
                    ("competition", "Compétition"),
                    ("breeding", "Reproduction / élevage"),
                    ("racing", "Courses"),
                    ("sales", "Vente"),
                    ("export", "Export"),
                    ("company", "Compagnie"),
                    ("other", "Autre"),
                    ("unknown", "Inconnu"),
                ],
                db_index=True,
                default="unknown",
                help_text="Usage principal de l'animal pour déterminer les règles sanitaires applicables.",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="living_context",
            field=models.CharField(
                choices=[
                    ("alone", "Seul"),
                    ("closed_private_group", "Groupe privé stable"),
                    ("boarding_stable", "Pension / écurie collective"),
                    ("competition_yard", "Écurie de sport / compétition"),
                    ("breeding_farm", "Élevage"),
                    ("unknown", "Inconnu"),
                ],
                db_index=True,
                default="unknown",
                help_text="Contexte de vie de l'animal : seul, groupe privé, pension, élevage, etc.",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="travels_outside_home",
            field=models.BooleanField(
                default=False,
                help_text="Indique si l'animal sort régulièrement de son lieu de vie : concours, transport, stages, saillie, soins, etc.",
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="external_animals_contact",
            field=models.BooleanField(
                default=False,
                help_text="Indique si l'animal est en contact avec des animaux extérieurs à son groupe habituel.",
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="has_young_or_pregnant_animals_on_site",
            field=models.BooleanField(
                default=False,
                help_text="Indique la présence de jeunes animaux ou de femelles gestantes sur le lieu de vie.",
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="is_breeding_animal",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text="Indique si l'animal est utilisé ou destiné à la reproduction.",
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="reproductive_status",
            field=models.CharField(
                choices=[
                    ("not_applicable", "Non applicable"),
                    ("empty", "Vide"),
                    ("pregnant", "Gestante"),
                    ("with_young", "Suitée / avec petit"),
                    ("to_be_bred", "À faire reproduire"),
                    ("breeding_male", "Reproducteur mâle"),
                    ("retired_from_breeding", "Retiré de la reproduction"),
                    ("unknown", "Inconnu"),
                ],
                default="not_applicable",
                help_text="Statut reproducteur de l'animal.",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="expected_birth_date",
            field=models.DateField(
                blank=True,
                null=True,
                help_text="Date prévue de mise bas / naissance, si applicable.",
            ),
        ),
        migrations.AddField(
            model_name="animal",
            name="is_active",
            field=models.BooleanField(
                db_index=True,
                default=True,
                help_text="Permet de désactiver les rappels pour un animal vendu, décédé ou archivé.",
            ),
        ),
    ]
