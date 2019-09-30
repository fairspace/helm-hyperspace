FROM openjdk:11-jre

RUN apt-get update
RUN apt-get install -y procps

ADD build/distributions/*.tar /opt/

WORKDIR "/opt/config"
CMD ["/bin/sh", "-c", "JAVA_OPTS=-Dlog4j.configuration=file:log4j.properties /opt/logaggregator-*/bin/logaggregator"]
