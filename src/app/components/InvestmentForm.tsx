'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const assetTypes = [
  { id: 'stocks', name: 'Public Stocks', description: 'Major market stocks and indices' },
  { id: 'etfs', name: 'ETFs', description: 'Exchange-traded funds' },
  { id: 'mutual_funds', name: 'Mutual Funds', description: 'Professionally managed investment funds' },
  { id: 'emerging_markets', name: 'Emerging Markets', description: 'High-growth potential markets' },
  { id: 'crypto', name: 'Cryptocurrencies', description: 'Digital assets and tokens' },
  { id: 'bonds', name: 'Bonds', description: 'Government and corporate bonds' },
];

const riskAssessmentQuestions = [
  {
    id: 1,
    question: "What is your primary investment goal?",
    options: [
      { text: "Preserve my wealth and avoid losses", score: 1 },
      { text: "Generate steady income with moderate growth", score: 2 },
      { text: "Balance between growth and stability", score: 3 },
      { text: "Achieve significant long-term growth", score: 4 },
      { text: "Maximize returns, comfortable with high volatility", score: 5 }
    ]
  },
  {
    id: 2,
    question: "How would you react if your portfolio lost 20% in a month?",
    options: [
      { text: "Sell everything immediately", score: 1 },
      { text: "Sell some investments to reduce risk", score: 2 },
      { text: "Wait and see before making any decisions", score: 3 },
      { text: "Keep current investments but pause new ones", score: 4 },
      { text: "Buy more to take advantage of lower prices", score: 5 }
    ]
  },
  {
    id: 3,
    question: "What's your investment time horizon?",
    options: [
      { text: "Less than 2 years", score: 1 },
      { text: "2-5 years", score: 2 },
      { text: "5-10 years", score: 3 },
      { text: "10-20 years", score: 4 },
      { text: "More than 20 years", score: 5 }
    ]
  },
  {
    id: 4,
    question: "What's your investment experience level?",
    options: [
      { text: "No experience", score: 1 },
      { text: "Some basic knowledge", score: 2 },
      { text: "Moderate experience with stocks/bonds", score: 3 },
      { text: "Experienced with various investments", score: 4 },
      { text: "Advanced knowledge of all asset types", score: 5 }
    ]
  },
  {
    id: 5,
    question: "What percentage of your total savings are you investing?",
    options: [
      { text: "Less than 10%", score: 5 },
      { text: "10-25%", score: 4 },
      { text: "25-50%", score: 3 },
      { text: "50-75%", score: 2 },
      { text: "More than 75%", score: 1 }
    ]
  }
];

type PortfolioData = {
  allocation: {
    [key: string]: {
      amount: number;
      percentage: number;
      expectedReturn: number;
      volatility: number;
    };
  };
  metrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
};

type InvestmentFormProps = {
  onOptimize: (data: PortfolioData) => void;
};

export default function InvestmentForm({ onOptimize }: InvestmentFormProps) {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  // Format number with commas
  const formatNumber = (value: string) => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const rawValue = value.replace(/,/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setInvestmentAmount(formatNumber(rawValue));
    }
  };

  const getRawValue = () => {
    return investmentAmount.replace(/,/g, '');
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === assetTypes.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assetTypes.map(asset => asset.id));
    }
  };

  const handleAnswerSelect = (score: number) => {
    setIsTransitioning(true);
    const newAnswers = [...answers, score];
    
    setTimeout(() => {
      if (newAnswers.length === riskAssessmentQuestions.length) {
        const totalScore = newAnswers.reduce((sum, score) => sum + score, 0);
        const maxPossibleScore = riskAssessmentQuestions.length * 5;
        const calculatedRiskTolerance = Math.round((totalScore / maxPossibleScore) * 100);
        setRiskTolerance(calculatedRiskTolerance);
        setShowQuiz(false);
      } else {
        setAnswers(newAnswers);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      setIsTransitioning(false);
    }, 500); // Increased duration to 500ms
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rawAmount = parseInt(getRawValue() || '0');
      const response = await fetch('/api/optimize-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: rawAmount,
          assetTypes: selectedAssets,
          riskTolerance,
        }),
      });

      if (!response.ok) throw new Error('Optimization failed');

      const data = await response.json();
      const portfolioData = {
        ...data,
        investmentAmount: rawAmount
      };
      localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
      router.push('/overview');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = riskAssessmentQuestions[currentQuestionIndex];

  return (
    <form onSubmit={handleSubmit} className="card w-full">
      <div className="space-y-12">
        {/* Investment Amount */}
        <div>
          <label className="block text-lg text-white/70 mb-4">
            Investment Amount
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 text-xl">$</span>
            <input
              type="text"
              value={investmentAmount}
              onChange={handleAmountChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-xl focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Enter amount"
              required
            />
          </div>
        </div>

        {/* Asset Types */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-lg text-white/70">
              Select Asset Types
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
            >
              {selectedAssets.length === assetTypes.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assetTypes.map((asset) => (
              <label
                key={asset.id}
                className={`relative flex items-start p-6 cursor-pointer rounded-xl border transition-all ${
                  selectedAssets.includes(asset.id)
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedAssets.includes(asset.id)}
                  onChange={(e) => {
                    setSelectedAssets(
                      e.target.checked
                        ? [...selectedAssets, asset.id]
                        : selectedAssets.filter(id => id !== asset.id)
                    );
                  }}
                />
                <div>
                  <div className="text-lg font-medium">{asset.name}</div>
                  <div className="text-base text-white/50 mt-1">{asset.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          {!showQuiz ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-lg text-white/70">
                  Risk Tolerance: {riskTolerance}%
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuiz(true);
                    setCurrentQuestionIndex(0);
                    setAnswers([]);
                  }}
                  className="text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                >
                  Take Risk Assessment Quiz
                </button>
              </div>
              <div className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
              <div className="relative w-full h-6">
                <div 
                  className="absolute w-1 h-4 bg-white -translate-x-1/2 top-0"
                  style={{ left: `${riskTolerance}%` }}
                />
              </div>
              <div className="flex justify-between text-base text-white/50">
                <span>Conservative</span>
                <span>Moderate</span>
                <span>Aggressive</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-8 overflow-hidden">
              <h3 className="text-xl font-medium mb-6">Question {currentQuestionIndex + 1} of {riskAssessmentQuestions.length}</h3>
              <div 
                className={`transition-all duration-500 ease-in-out transform ${
                  isTransitioning ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'
                }`}
              >
                <p className="text-lg mb-6">{currentQuestion.question}</p>
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAnswerSelect(option.score)}
                      className="w-full text-left p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !investmentAmount || selectedAssets.length === 0}
          className="w-full bg-white text-black py-4 rounded-xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors mt-8"
        >
          {loading ? 'Optimizing...' : 'Optimize Portfolio'}
        </button>
      </div>
    </form>
  );
} 