import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import Modal from './common/Modal';
import Input from './common/Input';
import Select from './common/Select';
import Button from './common/Button';
import { CURRENCIES } from '../constants';
import { ArrowLeftRightIcon } from './common/Icons';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversionResult {
  rate: number;
  convertedAmount: number;
  sourceCurrency: string;
  targetCurrency: string;
}

const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          rate: {
            type: Type.NUMBER,
            description: 'The exchange rate from the source currency to the target currency.',
          },
          convertedAmount: {
            type: Type.NUMBER,
            description: 'The final converted amount in the target currency.',
          },
          sourceCurrency: {
            type: Type.STRING,
            description: 'The three-letter code of the source currency (e.g., USD).',
          },
          targetCurrency: {
            type: Type.STRING,
            description: 'The three-letter code of the target currency (e.g., EUR).',
          },
        },
        required: ['rate', 'convertedAmount', 'sourceCurrency', 'targetCurrency'],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `What is the current exchange rate to convert ${amount} ${fromCurrency} to ${toCurrency}?`,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const jsonString = response.text.trim();
      const parsedResult = JSON.parse(jsonString) as ConversionResult;
      setResult(parsedResult);
    } catch (e) {
      console.error('Currency conversion failed:', e);
      setError('Failed to fetch conversion rate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSwapCurrencies = () => {
      const temp = fromCurrency;
      setFromCurrency(toCurrency);
      setToCurrency(temp);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Currency Converter">
      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" />
        </div>
        <div className="flex items-center gap-2">
            <div className="flex-1">
                <label htmlFor="fromCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">From</label>
                <Select id="fromCurrency" value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </Select>
            </div>
            <Button size="icon" variant="secondary" onClick={handleSwapCurrencies} className="mt-6">
                <ArrowLeftRightIcon className="w-5 h-5"/>
            </Button>
            <div className="flex-1">
                <label htmlFor="toCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">To</label>
                <Select id="toCurrency" value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </Select>
            </div>
        </div>

        <div className="flex justify-end pt-2">
            <Button onClick={handleConvert} disabled={isLoading}>
                {isLoading ? 'Converting...' : 'Convert'}
            </Button>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        
        {result && (
            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in">
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {Number(amount).toLocaleString()} {result.sourceCurrency} =
                </p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 my-1">
                    {result.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {result.targetCurrency}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Exchange Rate: 1 {result.sourceCurrency} = {result.rate.toFixed(4)} {result.targetCurrency}
                </p>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default CurrencyConverterModal;
