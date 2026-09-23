/**
 * How to reach the studio, and where it is. One definition each.
 *
 * These were scattered: the phone existed twice with the same digits written
 * two ways, and the place three times with three different endings — one of
 * which never said which country. A machine resolving an entity reads all of
 * them, and disagreeing copies of the same fact are what make it look like
 * two businesses.
 */

export const CONTACT_EMAIL = "mark@hbw.works";
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;

/** As it is written for a reader. */
export const CONTACT_PHONE = "0414 833 791";
/** The same number, as a machine dials it. Keep these two in step. */
export const CONTACT_PHONE_E164 = "+61414833791";

/** The place, as every visible surface should say it. */
export const STUDIO_PLACE = "Wentworth Falls, Blue Mountains, Australia";
/** Its parts, for structured data. Only what STUDIO_PLACE shows may be claimed. */
export const STUDIO_LOCALITY = "Wentworth Falls";
export const STUDIO_COUNTRY = "AU";
