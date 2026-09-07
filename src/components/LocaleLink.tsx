"use client";
import Link, { LinkProps } from 'next/link';
import React from 'react';
import { useLocale } from '@/context/LocaleContext';
import { withLocalePrefix } from '@/lib/localePath';

type Props = LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: React.ReactNode;
};

const LocaleLink: React.FC<Props> = ({ href, ...rest }) => {
    const { locale } = useLocale();
    const next =
        typeof href === 'string' ? withLocalePrefix(href, locale) : href;
    return <Link href={next} {...rest} />;
};

export default LocaleLink;
