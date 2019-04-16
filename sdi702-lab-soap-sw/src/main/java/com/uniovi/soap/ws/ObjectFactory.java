//
// Este archivo ha sido generado por la arquitectura JavaTM para la implantación de la referencia de enlace (JAXB) XML v2.2.7 
// Visite <a href="http://java.sun.com/xml/jaxb">http://java.sun.com/xml/jaxb</a> 
// Todas las modificaciones realizadas en este archivo se perderán si se vuelve a compilar el esquema de origen. 
// Generado el: 2019.04.16 a las 02:12:33 PM CEST 
//


package com.uniovi.soap.ws;

import javax.xml.bind.annotation.XmlRegistry;


/**
 * This object contains factory methods for each 
 * Java content interface and Java element interface 
 * generated in the com.uniovi.soap.ws package. 
 * <p>An ObjectFactory allows you to programatically 
 * construct new instances of the Java representation 
 * for XML content. The Java representation of XML 
 * content can consist of schema derived interfaces 
 * and classes representing the binding of schema 
 * type definitions, element declarations and model 
 * groups.  Factory methods for each of these are 
 * provided in this class.
 * 
 */
@XmlRegistry
public class ObjectFactory {


    /**
     * Create a new ObjectFactory that can be used to create new instances of schema derived classes for package: com.uniovi.soap.ws
     * 
     */
    public ObjectFactory() {
    }

    /**
     * Create an instance of {@link GetMarksResponse }
     * 
     */
    public GetMarksResponse createGetMarksResponse() {
        return new GetMarksResponse();
    }

    /**
     * Create an instance of {@link User }
     * 
     */
    public User createUser() {
        return new User();
    }

    /**
     * Create an instance of {@link GetMarksRequest }
     * 
     */
    public GetMarksRequest createGetMarksRequest() {
        return new GetMarksRequest();
    }

    /**
     * Create an instance of {@link Mark }
     * 
     */
    public Mark createMark() {
        return new Mark();
    }

}
