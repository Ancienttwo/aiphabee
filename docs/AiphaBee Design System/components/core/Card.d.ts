import React from 'react';

/**
 * The workhorse surface — compose with the Card* parts.
 * @startingPoint section="Core" subtitle="Card surface + parts" viewport="700x300"
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add a hover lift + honey border for clickable cards. */
  interactive?: boolean;
  /** Apply default padding directly (skip CardHeader/CardContent). */
  padded?: boolean;
  children?: React.ReactNode;
}

/**
 * The workhorse surface: white, 12px radius, hairline border, soft
 * shadow. Compose with CardHeader / CardTitle / CardDescription /
 * CardContent / CardFooter.
 *
 * @startingPoint section="Core" subtitle="Card surface + parts" viewport="700x300"
 */
export function Card(props: CardProps): JSX.Element;
export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>): JSX.Element;
export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element;
export function CardDescription(props: React.HTMLAttributes<HTMLParagraphElement>): JSX.Element;
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>): JSX.Element;
export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>): JSX.Element;
