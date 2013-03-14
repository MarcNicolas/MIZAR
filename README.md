RTWeb3D
=======

Contient le module Mizar pour SiTools2 

Installation du module � partir du d�p�t Git :
---
 * T�l�charger [SiTools2](http://sitools2.sourceforge.net/) ([lien direct vers la derni�re version](http://sourceforge.net/projects/sitools2/files/latest/download))
 * Installer SiTools2 (voire la [documentation de Sitools2](http://sourceforge.net/projects/sitools2/files/Documentation/V2.0/DG-SITOOLS2-V2-1.2.pdf/download))
 * R�cup�rer le module et le placer dans SiTools2 :
   	* `cd %SITOOLS%/workspace/client-user/js/modules`
	* `git clone https://github.com/TPZF/RTWeb3D.git mizarModule`
 * Lancer SiTools2 avec la commande : `%SiTools2%/sitools.sh start` pour les OS de type Unix ou `%SiTools2%/sitools.bat start` pour Windows
 * Configurer le module :
 	* Aller sur l'interface d'admin : http://localhost:8182/sitools/client-admin/* 
 	* Loggez-vous avec `Login: admin`, `mot de passe: admin`
 	* Cliquer sur Access Management/Projects/Project Modules
 	* Cr�er le module avec les parametres dont vous souhaitez, sauf les suivants:
 		* iconClass: mizarModule
 		* Le xtype�: sitools.component.mizarModule
 		* Ajouter 2 d�pendances�: /sitools/client-user/js/modules/mizarModule/mizar.js et /sitools/common/res/css/mizar.css
	* Rendre visible le module sur le portail utilisateur
		* Cliquer sur Access Managements/Projects/Projects 
		* D�sactiver le projet, �diter le et activer la visibilit� pour le module Mizar
			* Dans le champ "Module parameters" mettre `undefined`

 * Ajouter un proxy pour l'affichage des donn�es de base
 	 * Aller sur l'interface d'admin
	 * Cliquer sur Access Management/Application plugins/Application plugins
	 * Ajouter ProxyApp et configurer l'application comme ceci :
          * uri attachment :  /Alasky 
          * category : USER
          * useProxy : False
          * url client : http://alasky.u-strasbg.fr{rr}     // oui, il faut bien ajouter {rr}
          * mode : 6
 * N'oubliez pas de l'activer

Ceci est une configuration minimaliste qui assure l'affichage des donn�es visuelles.
Pour profiter de tous les avantages du module, il est n�cessaire d'installer des services.

Installation des services:
---
Tout d'abord il faut ajouter l'extension astronomique qui contient les services disponibles
 * T�l�charger fr.cnes.sitools.astronomy.jar [ici](http://sourceforge.net/projects/sitools2/files/Extensions/V2.0/)
 * Copier ce jar dans %SiTools2%\workspace\fr.cnes.sitools.core\ext
 * Relancer SiTools2 avec la commande `%SiTools2%/sitools.sh restart` pour les OS de type Unix ou `%SiTools2%/sitools.bat restart` pour Windows

Ajouter les services dans le projet
 * Aller sur l'interface d'admin
 * Cliquer sur Access Management/Projects/Project services
 * Ajouter les services suivants
   * Name Resolver Service, qui permet de trouver l'objet c�leste � partir de son nom
   * Reverse Name Resolver Service, qui permet de trouver le nom d'objet � partir de sa position
   * Solar Objects Service, qui permet de trouver les objets c�lestes qui se trouvent dans le syst�me solaire
   * GlobWeb Server, qui permet de configurer le module Mizar � partir de SiTools2
      * Mettre dans le champ 'conf' la valeur `mizarConf.ftl`
    	* Cr�er un fichier 'mizarConf.ftl' dans `%SiTools%/data/freemarker/`, ce fichier peut �tre initialis� � partir du contenu du fichier `js/conf.json`
      * Cliquer sur Access Managements/Projects/Projects, choisir votre projet, mettre `/sitools/%uri de votre projet%/plugin/globWeb` dans le champ "Module Parameters" de Mizar
   * Couverage Service, qui permet de visualiser les donn�es qui r�pr�sentent la couverture du ciel(fichiers MOC)

Build
---
Pour g�n�rer une version minifi�e, il est n�cessaire d'avoir install� [NodeJS](http://nodejs.org/download/).

Une fois install�, lancez `app/build/build.bat` pour les utilisateurs de Windows ou `app/build/node r.js -o build.js` pour les utilisateurs d'OS de type Unix.
Le script va g�n�rer les fichiers minifi�s dans le r�pertoire "generated".
Les fichiers int�ressants � r�cup�rer sont:
  * css
  * externals/*.js (sans GlobWeb)
  * js
  * index.html

Il suffit donc de placer ces fichiers dans le repertoire de production `mizarModule/app/`
