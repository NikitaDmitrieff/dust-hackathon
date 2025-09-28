#!/usr/bin/env python3
"""
Script de test pour démontrer le workflow complet :
1. Conversation vocale avec OpenAI (simulée)
2. Analyse de la conversation
3. Génération de formulaire basé sur l'analyse
"""

import asyncio
import json
import aiohttp
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8001"
TEST_SESSION_ID = "test_session_demo"

async def test_complete_workflow():
    """Test complet du workflow de création de formulaire par conversation"""
    
    print("🎙️  WORKFLOW COMPLET : De la conversation vocale au formulaire")
    print("=" * 60)
    
    # Simulation d'une conversation analysée (normalement générée automatiquement)
    simulated_analysis = """
USER INTENT ANALYSIS
====================

1. User's main intent/goal:
L'utilisateur veut créer un formulaire d'inscription pour un événement sportif (course à pied de 10km).

2. Key requests or needs mentioned:
- Formulaire d'inscription pour participants
- Collecter informations personnelles de base
- Informations de contact d'urgence
- Niveau d'expérience en course
- Taille de t-shirt pour le kit participant
- Restrictions alimentaires/allergies
- Acceptation des conditions générales

3. Any specific actions they want taken:
- Créer un formulaire simple et clair
- S'assurer que tous les champs nécessaires sont présents
- Permettre une inscription rapide et efficace
"""
    
    # 1. Sauvegarder l'analyse simulée
    analysis_dir = Path(__file__).parent / "analysis"
    analysis_dir.mkdir(exist_ok=True)
    analysis_file = analysis_dir / f"{TEST_SESSION_ID}_analysis.txt"
    
    with open(analysis_file, 'w', encoding='utf8') as f:
        f.write(simulated_analysis)
    
    print(f"✅ Analyse de conversation sauvegardée : {analysis_file.name}")
    
    # 2. Générer le formulaire basé sur l'analyse
    async with aiohttp.ClientSession() as session:
        url = f"{BASE_URL}/api/forms/from-conversation/{TEST_SESSION_ID}"
        
        print(f"\n🔄 Génération du formulaire via : {url}")
        
        try:
            async with session.post(url) as resp:
                if resp.status == 200:
                    form_data = await resp.json()
                    print("\n✅ Formulaire généré avec succès !")
                    print("-" * 40)
                    print(f"📋 Titre : {form_data['title']}")
                    print(f"📝 Description : {form_data['description']}")
                    print(f"\n🔢 Questions ({len(form_data['questions'])}) :")
                    
                    for i, question in enumerate(form_data['questions'], 1):
                        required = " (obligatoire)" if question['required'] else ""
                        print(f"  {i}. {question['question']} [{question['type']}]{required}")
                    
                    # Sauvegarder le formulaire généré pour référence
                    form_file = Path(__file__).parent / f"generated_form_{TEST_SESSION_ID}.json"
                    with open(form_file, 'w', encoding='utf8') as f:
                        json.dump(form_data, f, indent=2, ensure_ascii=False)
                    print(f"\n💾 Formulaire sauvegardé : {form_file.name}")
                    
                else:
                    error_text = await resp.text()
                    print(f"❌ Erreur {resp.status}: {error_text}")
        
        except Exception as e:
            print(f"❌ Erreur de connexion: {e}")
            print("💡 Assurez-vous que le serveur est lancé avec : python3 start.py")
    
    # 3. Tester l'endpoint d'analyse
    print("\n" + "=" * 60)
    print("🔍 Test de l'endpoint d'analyse de conversation")
    
    async with aiohttp.ClientSession() as session:
        url = f"{BASE_URL}/api/conversations/{TEST_SESSION_ID}/analysis"
        
        try:
            async with session.get(url) as resp:
                if resp.status == 200:
                    analysis_data = await resp.json()
                    print("✅ Analyse récupérée avec succès !")
                    print("-" * 40)
                    print("📊 Contenu de l'analyse :")
                    print(analysis_data['analysis'][:200] + "..." if len(analysis_data['analysis']) > 200 else analysis_data['analysis'])
                else:
                    print(f"❌ Erreur {resp.status}: {await resp.text()}")
        
        except Exception as e:
            print(f"❌ Erreur de connexion: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 WORKFLOW TERMINÉ")
    print("\n📋 Résumé du processus :")
    print("1. ✅ Conversation vocale (simulée)")
    print("2. ✅ Analyse automatique de l'intention")  
    print("3. ✅ Génération de formulaire personnalisé")
    print("4. ✅ Récupération et sauvegarde des données")
    
    print(f"\n💡 En production, connectez-vous au WebSocket /ws/{TEST_SESSION_ID}")
    print("   pour une vraie conversation vocale avec OpenAI !")

if __name__ == "__main__":
    asyncio.run(test_complete_workflow())
