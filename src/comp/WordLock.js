import React, { useState, useRef } from 'react';
import { Lock, Unlock, Check, X, Play, Volume2 } from 'lucide-react';

// Composant WordLock
const WordLock = () => {
  // Hash SHA-256 des mots-clés (remplacez ces hashs par vos propres mots)
  const TARGET_HASHES = [
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // "hello"
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // "world"
    'e258d248fda94c63753607f7c4494ee0fcbe92f1a76bfdac795c9d84101eb317', // "secret"
    '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', // "magic"
    'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9'  // "unlock"
  ];

  const [words, setWords] = useState(['', '', '', '', '']);
  const [validatedWords, setValidatedWords] = useState([false, false, false, false, false]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState([false, false, false, false, false]);

  // Fonction pour calculer le hash SHA-256
  const sha256 = async (text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text.toLowerCase().trim());
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Valider un mot spécifique
  const validateWord = async (index) => {
    if (!words[index].trim()) return;
    
    try {
      const hash = await sha256(words[index]);
      const isValid = hash === TARGET_HASHES[index];
      
      const newValidatedWords = [...validatedWords];
      const newErrors = [...errors];
      
      newValidatedWords[index] = isValid;
      newErrors[index] = !isValid;
      
      setValidatedWords(newValidatedWords);
      setErrors(newErrors);
      
      if (!isValid) {
        const timeoutId = setTimeout(() => {
          setErrors(prev => {
            const updated = [...prev];
            updated[index] = false;
            return updated;
          });
        }, 3000);
        return () => clearTimeout(timeoutId);
      }
      
      if (isValid && newValidatedWords.every(word => word)) {
        setIsUnlocked(true);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error validating word:', error);
    }
  };

  const handleWordChange = (index, value) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
    
    if (validatedWords[index] || errors[index]) {
      const newValidatedWords = [...validatedWords];
      const newErrors = [...errors];
      newValidatedWords[index] = false;
      newErrors[index] = false;
      setValidatedWords(newValidatedWords);
      setErrors(newErrors);
      setIsUnlocked(false);
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateWord(index);
    }
  };

  const resetLock = () => {
    setWords(['', '', '', '', '']);
    setValidatedWords([false, false, false, false, false]);
    setErrors([false, false, false, false, false]);
    setIsUnlocked(false);
    setShowSuccess(false);
  };

  return (
<div className="bg-gradient-to-br ... p-3 sm:p-4 font-serif">
  <div className="w-full max-w-2xl mx-auto">      {/* Animation de succès */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm">
          <div className="w-full max-w-sm p-4 transform border-4 border-yellow-400 shadow-2xl sm:p-8 bg-gradient-to-br from-yellow-900 to-orange-900 rounded-2xl animate-pulse">
            <div className="text-center">
              <Unlock className="w-16 h-16 mx-auto mb-4 text-yellow-400 sm:w-20 sm:h-20 sm:mb-6 drop-shadow-lg" />
              <h2 className="mb-2 text-2xl font-bold tracking-wide text-yellow-300 sm:text-3xl">Verrou débloqué !</h2>
              <p className="text-base text-yellow-200 sm:text-lg">Félicitations, vous avez trouvé tous les mots secrets !</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="w-full max-w-2xl mx-auto my-auto overflow-auto">
        <div className="bg-gradient-to-br from-[#2d1b10]/90 to-[#1a120b]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border-4 border-yellow-700/50 relative">
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-pulse"></div>
          
          {/* Header */}
          <div className="relative z-10 mb-6 text-center sm:mb-8">
            <div className="flex mb-4 sm:mb-6">
              {isUnlocked ? (
                <div className="relative">
                  <Unlock className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
                  <div className="absolute rounded-full -inset-2 bg-yellow-400/20 blur-xl animate-pulse"></div>
                </div>
              ) : (
                <div className="relative">
                  <Lock className="w-16 h-16 text-yellow-300 sm:w-20 sm:h-20 drop-shadow-lg" />
                  <div className="absolute rounded-full -inset-2 bg-yellow-300/10 blur-xl"></div>
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-yellow-400 mb-3 sm:mb-4 tracking-wide drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
              À vous de jouer
            </h1>
            <p className="max-w-xl px-2 mx-auto text-base leading-relaxed text-yellow-200 sm:text-lg md:text-xl">
              Trouvez les 5 mots secrets pour débloquer le verrou mystérieux. 
              Chaque mot doit être validé individuellement pour révéler le secret.
            </p>
          </div>

          {/* Champs de mots */}
          <div className="relative z-10 space-y-4 sm:space-y-6">
            {words.map((word, index) => (
              <div key={index} className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4 group">
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={`word-${index}`}
                    className="block mb-2 text-base font-medium tracking-wide sm:mb-3 sm:text-lg text-yellow-200/80"
                  >
                    Mot secret {index + 1}
                  </label>
                  <div className="relative">
                    <input
                      id={`word-${index}`}
                      type="text"
                      value={word}
                      onChange={(e) => handleWordChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyPress(index, e)}
                      aria-describedby={`word-${index}-status`}
                      aria-invalid={errors[index] ? 'true' : 'false'}
                      className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#1a120b]/80 to-[#2d1b10]/80 border-2 sm:border-3 rounded-lg sm:rounded-xl text-yellow-100 placeholder-yellow-300/50 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 transition-all duration-300 text-base sm:text-lg font-medium backdrop-blur-sm ${
                        validatedWords[index] 
                          ? 'border-yellow-400 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 shadow-[0_0_20px_rgba(255,215,0,0.3)]' 
                          : errors[index]
                          ? 'border-red-500 bg-gradient-to-r from-red-900/30 to-red-800/30 shadow-[0_0_20px_rgba(255,0,0,0.3)]'
                          : 'border-yellow-700/50 focus:border-yellow-400 hover:border-yellow-500/70'
                      }`}
                      placeholder="Entrez le mot secret..."
                      disabled={validatedWords[index]}
                    />
                    {validatedWords[index] && (
                      <div className="absolute transform -translate-y-1/2 right-3 sm:right-4 top-1/2">
                        <Check className="w-5 h-5 text-yellow-400 sm:w-6 sm:h-6 drop-shadow-lg" />
                        <div className="absolute rounded-full -inset-1 bg-yellow-400/30 blur-sm"></div>
                      </div>
                    )}
                    {errors[index] && (
                      <div className="absolute transform -translate-y-1/2 right-3 sm:right-4 top-1/2">
                        <X className="w-5 h-5 text-red-400 sm:w-6 sm:h-6 drop-shadow-lg" />
                        <div className="absolute rounded-full -inset-1 bg-red-400/30 blur-sm"></div>
                      </div>
                    )}
                  </div>
                  {/* Message d'état pour l'accessibilité */}
                  <div id={`word-${index}-status`} className="sr-only">
                    {validatedWords[index] ? 'Mot validé avec succès' : 
                     errors[index] ? 'Mot incorrect, veuillez réessayer' : 
                     'Champ de saisie pour le mot secret'}
                  </div>
                </div>
                <button
                  onClick={() => validateWord(index)}
                  disabled={!word.trim() || validatedWords[index]}
                  aria-label={`Valider le mot secret ${index + 1}`}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all duration-300 border-2 uppercase tracking-wide shadow-lg ${
                    validatedWords[index]
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-[#1a120b] border-yellow-400 cursor-not-allowed shadow-[0_0_15px_rgba(255,215,0,0.5)]'
                      : word.trim()
                      ? 'bg-gradient-to-r from-yellow-700 to-orange-700 hover:from-yellow-600 hover:to-orange-600 text-[#1a120b] border-yellow-600 hover:border-yellow-400 shadow-xl hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-500/50'
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-400 border-gray-600 cursor-not-allowed'
                  }`}
                >
                  {validatedWords[index] ? 'Validé ✓' : 'Valider'}
                </button>
              </div>
            ))}
          </div>

          {/* Statut */}
          <div className="relative z-10 mt-8 text-center sm:mt-10">
            <div className="inline-flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-gradient-to-r from-[#1a120b]/80 to-[#2d1b10]/80 rounded-xl sm:rounded-full px-6 sm:px-8 py-4 border-2 border-yellow-700/50 backdrop-blur-sm">
              <div className="flex space-x-2" role="progressbar" aria-label="Progression des mots secrets" aria-valuenow={validatedWords.filter(Boolean).length} aria-valuemin="0" aria-valuemax="5">
                {validatedWords.map((isValid, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-300 ${
                      isValid 
                        ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_10px_rgba(255,215,0,0.6)]' 
                        : 'bg-transparent border-yellow-600/50'
                    }`}
                    aria-label={`Mot secret ${index + 1} ${isValid ? 'validé' : 'non validé'}`}
                  />
                ))}
              </div>
              <span className="text-base font-medium text-yellow-200 sm:text-lg">
                {validatedWords.filter(Boolean).length} / 5 mots secrets trouvés
              </span>
            </div>
            
            {isUnlocked && (
              <button
                onClick={resetLock}
                className="w-full px-6 py-3 mt-4 text-base font-medium text-yellow-200 transition-all duration-300 border-2 rounded-lg sm:w-auto sm:px-8 sm:mt-6 sm:text-lg bg-gradient-to-r from-yellow-700/30 to-orange-700/30 hover:from-yellow-600/40 hover:to-orange-600/40 sm:rounded-xl border-yellow-600/50 hover:border-yellow-400/70 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-yellow-500/50"
                aria-label="Réinitialiser le verrou pour recommencer"
              >
                Réinitialiser le verrou
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
    
  );
};

export default WordLock;