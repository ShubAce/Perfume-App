"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePersonalization } from "@/context/PersonalizationContext";

interface QuizQuestion {
	id: string;
	question: string;
	subtitle?: string;
	options: {
		id: string;
		label: string;
		icon: string;
		value: string;
	}[];
	multiSelect?: boolean;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
	{
		id: "gender",
		question: "Who is this fragrance for?",
		options: [
			{ id: "men", label: "For Him", icon: "👔", value: "men" },
			{ id: "women", label: "For Her", icon: "👗", value: "women" },
			{ id: "unisex", label: "Anyone", icon: "✨", value: "unisex" },
		],
	},
	{
		id: "mood",
		question: "What mood do you want to create?",
		subtitle: "Select up to 2 moods",
		multiSelect: true,
		options: [
			{ id: "fresh", label: "Fresh & Clean", icon: "🌊", value: "fresh" },
			{ id: "romantic", label: "Romantic", icon: "💕", value: "romantic" },
			{ id: "confident", label: "Bold & Confident", icon: "💪", value: "bold" },
			{ id: "mysterious", label: "Mysterious", icon: "🌙", value: "mysterious" },
			{ id: "playful", label: "Playful & Fun", icon: "🎉", value: "sweet" },
			{ id: "sophisticated", label: "Sophisticated", icon: "🎩", value: "woody" },
		],
	},
	{
		id: "occasion",
		question: "When will you wear it most?",
		options: [
			{ id: "daily", label: "Everyday", icon: "☀️", value: "daily" },
			{ id: "office", label: "Work / Office", icon: "💼", value: "office" },
			{ id: "date", label: "Date Night", icon: "🌹", value: "date" },
			{ id: "party", label: "Parties & Events", icon: "🎊", value: "party" },
			{ id: "special", label: "Special Occasions", icon: "💎", value: "special" },
		],
	},
	{
		id: "intensity",
		question: "How strong should it be?",
		subtitle: "How long and far should people notice your scent?",
		options: [
			{ id: "light", label: "Subtle & Intimate", icon: "🌸", value: "light" },
			{ id: "moderate", label: "Noticeable", icon: "🌺", value: "moderate" },
			{ id: "strong", label: "Bold & Powerful", icon: "🔥", value: "strong" },
		],
	},
	{
		id: "notes",
		question: "Which scent family appeals to you?",
		subtitle: "Select your favorites",
		multiSelect: true,
		options: [
			{ id: "citrus", label: "Citrus", icon: "🍋", value: "citrus" },
			{ id: "floral", label: "Floral", icon: "🌷", value: "floral" },
			{ id: "woody", label: "Woody", icon: "🌲", value: "woody" },
			{ id: "oriental", label: "Oriental/Spicy", icon: "🌶️", value: "oriental" },
			{ id: "fresh", label: "Fresh/Aquatic", icon: "💧", value: "aquatic" },
			{ id: "gourmand", label: "Gourmand/Sweet", icon: "🍯", value: "vanilla" },
		],
	},
	{
		id: "season",
		question: "What's your favorite season?",
		subtitle: "We'll match scents to the weather",
		options: [
			{ id: "spring", label: "Spring", icon: "🌸", value: "spring" },
			{ id: "summer", label: "Summer", icon: "☀️", value: "summer" },
			{ id: "fall", label: "Fall", icon: "🍂", value: "fall" },
			{ id: "winter", label: "Winter", icon: "❄️", value: "winter" },
		],
	},
];

export default function QuizPage() {
	const router = useRouter();
	const { trackPreference } = usePersonalization();
	const [currentStep, setCurrentStep] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string[]>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currentQuestion = QUIZ_QUESTIONS[currentStep];
	const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

	const handleSelect = (optionId: string, value: string) => {
		const currentAnswers = answers[currentQuestion.id] || [];

		if (currentQuestion.multiSelect) {
			if (currentAnswers.includes(optionId)) {
				// Remove selection
				setAnswers({
					...answers,
					[currentQuestion.id]: currentAnswers.filter((id) => id !== optionId),
				});
			} else if (currentAnswers.length < 2) {
				// Add selection (max 2)
				setAnswers({
					...answers,
					[currentQuestion.id]: [...currentAnswers, optionId],
				});
				// Track preference
				trackPreference(currentQuestion.id === "notes" ? "scent" : currentQuestion.id === "mood" ? "mood" : "occasion", value);
			}
		} else {
			setAnswers({
				...answers,
				[currentQuestion.id]: [optionId],
			});
			// Track preference
			if (currentQuestion.id === "occasion") {
				trackPreference("occasion", value);
			} else if (currentQuestion.id === "mood") {
				trackPreference("mood", value);
			}
		}
	};

	const isSelected = (optionId: string) => {
		return (answers[currentQuestion.id] || []).includes(optionId);
	};

	const canProceed = (answers[currentQuestion.id] || []).length > 0;

	const handleNext = () => {
		if (currentStep < QUIZ_QUESTIONS.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			handleSubmit();
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);

		// Build search query from answers
		const params = new URLSearchParams();

		// Gender
		if (answers.gender?.[0]) {
			const genderOption = QUIZ_QUESTIONS[0].options.find((o) => o.id === answers.gender[0]);
			if (genderOption) params.set("gender", genderOption.value);
		}

		// Mood
		if (answers.mood?.length) {
			const moodValues = answers.mood.map((id) => QUIZ_QUESTIONS[1].options.find((o) => o.id === id)?.value).filter(Boolean);
			if (moodValues[0]) params.set("mood", moodValues[0]);
		}

		// Occasion
		if (answers.occasion?.[0]) {
			const occasionOption = QUIZ_QUESTIONS[2].options.find((o) => o.id === answers.occasion[0]);
			if (occasionOption) params.set("occasion", occasionOption.value);
		}

		// Scent notes
		if (answers.notes?.length) {
			const noteValues = answers.notes.map((id) => QUIZ_QUESTIONS[4].options.find((o) => o.id === id)?.value).filter(Boolean);
			if (noteValues[0]) params.set("q", noteValues.join(" "));
		}

		// Redirect to search with quiz results
		router.push(`/search?${params.toString()}&from=quiz`);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-amber-50">
			<Navbar />

			<main className="mx-auto max-w-2xl px-4 py-12">
				{/* Progress Bar */}
				<div className="mb-8">
					<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
						<span>
							Question {currentStep + 1} of {QUIZ_QUESTIONS.length}
						</span>
						<button
							onClick={() => router.push("/shop/all")}
							className="text-purple-600 hover:text-purple-700"
						>
							Skip quiz
						</button>
					</div>
					<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full bg-linear-to-r from-purple-600 to-pink-600 transition-all duration-500"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				{/* Question Card */}
				<div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
					<div className="text-center mb-8">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{currentQuestion.question}</h1>
						{currentQuestion.subtitle && <p className="mt-2 text-gray-600">{currentQuestion.subtitle}</p>}
					</div>

					{/* Options Grid */}
					<div
						className={`grid gap-4 ${currentQuestion.options.length <= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}
					>
						{currentQuestion.options.map((option) => (
							<button
								key={option.id}
								onClick={() => handleSelect(option.id, option.value)}
								className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
									isSelected(option.id)
										? "border-purple-500 bg-purple-50 shadow-lg scale-105"
										: "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
								}`}
							>
								{isSelected(option.id) && (
									<div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
										<svg
											className="w-4 h-4 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</div>
								)}
								<div className="text-4xl mb-3">{option.icon}</div>
								<div className="font-medium text-gray-900">{option.label}</div>
							</button>
						))}
					</div>
				</div>

				{/* Navigation Buttons */}
				<div className="flex items-center justify-between">
					<button
						onClick={handleBack}
						disabled={currentStep === 0}
						className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
							currentStep === 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-white hover:shadow-md"
						}`}
					>
						<ArrowLeft className="h-5 w-5" />
						Back
					</button>

					<button
						onClick={handleNext}
						disabled={!canProceed || isSubmitting}
						className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
							canProceed
								? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl"
								: "bg-gray-200 text-gray-400 cursor-not-allowed"
						}`}
					>
						{isSubmitting ? (
							<>
								<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
								Finding...
							</>
						) : currentStep === QUIZ_QUESTIONS.length - 1 ? (
							<>
								<Sparkles className="h-5 w-5" />
								Find My Scents
							</>
						) : (
							<>
								Next
								<ArrowRight className="h-5 w-5" />
							</>
						)}
					</button>
				</div>
			</main>

			<Footer />
		</div>
	);
}
